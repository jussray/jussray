#!/usr/bin/env python3
"""Explicit, bounded external evidence acquisition for offline Medusa.

One GET, no redirects, public IP pinned through TCP and TLS, 5 MiB maximum.
Fetch never modifies or authorizes a Medusa assessment. Byte validation is
not proof of source trust, correctness, approval or release authority.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import http.client
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
import ssl
import stat
import sys
import time
from urllib.parse import urlsplit, parse_qsl

MAX_BYTES = 5 * 1024 * 1024
TIMEOUT = 15
CONTENT_TYPES = {"text/html", "text/plain", "text/markdown", "text/csv",
                 "application/json", "application/xml", "text/xml", "application/pdf",
                 "application/xhtml+xml", "application/ld+json"}
SENSITIVE = {"token", "key", "apikey", "secret", "password", "passwd", "pwd",
             "sig", "signature", "session", "sessionid", "auth", "authorization",
             "code", "jwt", "bearer", "accesstoken", "idtoken", "refreshtoken", "clientsecret"}
EXTS = {"text/html": ".html", "text/plain": ".txt", "text/markdown": ".md",
        "text/csv": ".csv", "application/json": ".json", "application/pdf": ".pdf",
        "application/xml": ".xml", "text/xml": ".xml", "application/xhtml+xml": ".html",
        "application/ld+json": ".json"}

class FetchError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise FetchError(message)


def parse_url(url):
    try:
        p = urlsplit(url)
        require(p.scheme in ("https", "http"), "only https/http URLs are allowed")
        require(p.hostname is not None, "missing hostname")
        require("@" not in p.netloc, "userinfo in URL refused")
        require(p.port is None or 1 <= p.port <= 65535, "invalid port")
        # A URL fragment is not sent over HTTP; reject to avoid misleading origin claims.
        require(not p.fragment, "URL fragments are not admissible evidence")
        for key, _ in parse_qsl(p.query, keep_blank_values=True):
            normalized = re.sub(r"[^a-z0-9]", "", key.lower())
            require(normalized not in SENSITIVE and not normalized.endswith("token") and not normalized.endswith("secret"),
                    "sensitive URL query key refused")
        return p
    except (ValueError, UnicodeError) as exc:
        if isinstance(exc, FetchError):
            raise
        raise FetchError("malformed or unsafe URL") from None


def safe_origin(p):
    """Never emit the literal request path or query values; URLs may contain secrets."""
    host = p.hostname or "unknown"
    port = p.port
    host_display = f"[{host}]" if ":" in host else host
    port_display = f":{port}" if port and port != (443 if p.scheme == "https" else 80) else ""
    return f"{p.scheme}://{host_display}{port_display}/[path-and-query-redacted]"


def safe_filename(name):
    require(isinstance(name, str) and name and not name.startswith("."), "unsafe filename")
    require(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}", name) is not None,
            "unsafe filename")
    require(name not in (".", "..") and not name.endswith("."), "unsafe filename")
    return name


def derive_filename(p, content_type):
    raw = p.path.rsplit("/", 1)[-1] or "index"
    name = re.sub(r"[^A-Za-z0-9._-]", "_", raw)
    if not name or name.startswith("."):
        name = "index"
    if "." not in name:
        name += EXTS.get(content_type, ".bin")
    return safe_filename(name[:128].rstrip("."))


def public_ip(hostname):
    try:
        infos = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except (socket.gaierror, UnicodeError):
        raise FetchError("cannot resolve host") from None
    candidates = []
    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except (IndexError, ValueError):
            continue
        if getattr(ip, "ipv4_mapped", None):
            ip = ip.ipv4_mapped
        if ip.is_global:
            candidates.append(str(ip))
    require(bool(candidates), "no public IP address; refused")
    return candidates[0]


class PinnedHTTP(http.client.HTTPConnection):
    def __init__(self, host, port, ip):
        super().__init__(host, port, timeout=TIMEOUT)
        self.ip = ip

    def connect(self):
        self.sock = socket.create_connection((self.ip, self.port), timeout=self.timeout)


class PinnedHTTPS(http.client.HTTPSConnection):
    def __init__(self, host, port, ip):
        super().__init__(host, port, timeout=TIMEOUT, context=ssl.create_default_context())
        self.ip = ip

    def connect(self):
        sock = socket.create_connection((self.ip, self.port), timeout=self.timeout)
        try:
            self.sock = self._context.wrap_socket(sock, server_hostname=self.host)
        except BaseException:
            sock.close()
            raise


def read_url(url, allow_http=False):
    p = parse_url(url)
    require(allow_http or p.scheme == "https", "HTTP refused; HTTPS required")
    host = p.hostname
    port = p.port or (443 if p.scheme == "https" else 80)
    ip = public_ip(host)
    conn = PinnedHTTPS(host, port, ip) if p.scheme == "https" else PinnedHTTP(host, port, ip)
    try:
        request_target = (p.path or "/") + (("?" + p.query) if p.query else "")
        conn.request("GET", request_target, headers={
            "Accept-Encoding": "identity", "User-Agent": "medusa-fetch/2.1",
            "Accept": ", ".join(sorted(CONTENT_TYPES))})
        response = conn.getresponse()
        require(not 300 <= response.status < 400,
                f"HTTP {response.status}: redirect refused; independently inspect final URL")
        require(response.status == 200, f"HTTP {response.status}: only full 200 responses supported")
        content_type = (response.getheader("Content-Type") or "").split(";")[0].strip().lower()
        require(content_type in CONTENT_TYPES, "Content-Type not allowlisted")
        encoding = (response.getheader("Content-Encoding") or "identity").lower()
        require(encoding == "identity", "compressed response refused")
        length = response.getheader("Content-Length")
        if length is not None:
            require(length.isdecimal(), "invalid Content-Length")
            require(int(length) <= MAX_BYTES, "Content-Length exceeds limit")
        body = bytearray()
        deadline = time.monotonic() + TIMEOUT
        while True:
            remaining = deadline - time.monotonic()
            require(remaining > 0, "overall response timeout exceeded")
            if conn.sock is not None:
                conn.sock.settimeout(remaining)
            part = response.read(min(65536, MAX_BYTES - len(body) + 1))
            if not part:
                break
            body.extend(part)
            require(len(body) <= MAX_BYTES, "response exceeds limit")
        if length is not None:
            require(len(body) == int(length), "Content-Length mismatch")
        return p, ip, content_type, bytes(body)
    except (OSError, ssl.SSLError, http.client.HTTPException):
        raise FetchError("connection or transport failed") from None
    finally:
        conn.close()


def secure_create(path):
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    return os.open(path, flags, 0o600)


def write_pair(file_path, body, manifest):
    manifest_path = Path(str(file_path) + ".manifest.json")
    require(not file_path.is_symlink() and not manifest_path.is_symlink(), "symlink output refused")
    require(not os.path.lexists(file_path) and not os.path.lexists(manifest_path), "refusing overwrite")
    # Reserve *both* names exclusively before writing either payload.
    fd_file = secure_create(file_path)
    try:
        fd_manifest = secure_create(manifest_path)
    except BaseException:
        os.close(fd_file)
        file_path.unlink()
        raise
    try:
        with os.fdopen(fd_file, "wb") as target, os.fdopen(fd_manifest, "w", encoding="utf-8") as sidecar:
            target.write(body)
            target.flush()
            os.fsync(target.fileno())
            json.dump(manifest, sidecar, indent=2, sort_keys=True)
            sidecar.write("\n")
            sidecar.flush()
            os.fsync(sidecar.fileno())
    except BaseException:
        file_path.unlink(missing_ok=True)
        manifest_path.unlink(missing_ok=True)
        raise
    return manifest_path


def fetch_one(args):
    p = parse_url(args.url)
    require(args.allow_http or p.scheme == "https", "HTTP refused; HTTPS required")
    # Validate names and occupied destinations BEFORE any network connection.
    if args.name:
        safe_filename(args.name)
    output_dir = Path(args.out).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    require(output_dir.is_dir(), "output directory invalid")
    if args.name:
        early = output_dir / args.name
        require(not os.path.lexists(early) and not os.path.lexists(str(early) + ".manifest.json"),
                "refusing overwrite")
    p, ip, content_type, body = read_url(args.url, args.allow_http)
    filename = safe_filename(args.name) if args.name else derive_filename(p, content_type)
    target = output_dir / filename
    require(target.parent == output_dir, "output directory escape")
    manifest = {"fetcher_version": "2.1", "requested_url_safe": safe_origin(p),
                "requested_url_sha256": hashlib.sha256(args.url.encode()).hexdigest(),
                "resolved_ip": ip, "resolved_hostname": p.hostname, "status": 200,
                "content_type": content_type, "bytes": len(body),
                "sha256": hashlib.sha256(body).hexdigest(),
                "saved_to": str(target), "fetched_at": datetime.now(timezone.utc).isoformat(),
                "review_required": True, "can_authorize": False}
    manifest_path = write_pair(target, body, manifest)
    print(f"FETCHED_BYTES_ONLY: {len(body)} bytes; sha256={manifest['sha256']}")
    print(f"ORIGIN_REDACTED: {manifest['requested_url_safe']}")
    print(f"FILE: {target.name}; MANIFEST: {manifest_path.name}")
    print("Human review and explicit scope admission required; nothing was added to Medusa.")
    return 0


def secure_read(path):
    require(not path.is_symlink(), "symlink input refused")
    flags = os.O_RDONLY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(path, flags)
    with os.fdopen(fd, "rb") as reader:
        mode = os.fstat(reader.fileno()).st_mode
        require(stat.S_ISREG(mode), "not a regular file")
        body = reader.read(MAX_BYTES + 1)
    require(len(body) <= MAX_BYTES, "file exceeds maximum size")
    return body


def admit_one(args):
    target = Path(args.file).absolute()
    manifest = Path(str(target) + ".manifest.json")
    content = secure_read(target)
    sidecar = json.loads(secure_read(manifest))
    require(isinstance(sidecar, dict) and sidecar.get("fetcher_version") == "2.1", "manifest incompatible")
    require(sidecar.get("saved_to") == str(target), "manifest path mismatch")
    require(sidecar.get("bytes") == len(content), "manifest length mismatch")
    require(sidecar.get("sha256") == hashlib.sha256(content).hexdigest(), "manifest hash mismatch")
    require(sidecar.get("can_authorize") is False and sidecar.get("review_required") is True,
            "manifest does not preserve human-review boundary")
    print("VERIFIED_BYTES_ONLY: integrity check succeeded, source authenticity unproven.")
    print("Human must review content, then explicitly add its path+hash to an assessment.")
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)
    f = sub.add_parser("fetch")
    f.add_argument("url")
    f.add_argument("--out", required=True)
    f.add_argument("--name")
    f.add_argument("--allow-http", action="store_true")
    a = sub.add_parser("admit", help="verify integrity, never auto-admit")
    a.add_argument("file")
    args = p.parse_args(argv)
    try:
        return fetch_one(args) if args.command == "fetch" else admit_one(args)
    except (FetchError, OSError, ValueError, json.JSONDecodeError):
        # Avoid reflecting remote URL, filenames or tokens in error outputs.
        print("medusa_fetch: REFUSED (validation, network, or integrity check failed)", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())

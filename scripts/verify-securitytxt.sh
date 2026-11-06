#!/usr/bin/env bash
# usage: bash scripts/verify-securitytxt.sh host1 host2 ...
# Read-only live probe. A passing result does not prove email delivery.
set -u

if [ "$#" -eq 0 ]; then
  echo "usage: $0 host1 host2 ..." >&2
  exit 2
fi

failed=0
for h in "$@"; do
  case "$h" in
    sekretbip.net|bip-lins.cloudflare.app|sekret.cloudflare.app)
      email='support@sekretbip.net' ;;
    foundercontrolroom.org|founder-control-room2.cloudflare.app|fcr-mail.cloudflare.app)
      email='support@foundercontrolroom.org' ;;
    jussbeautifulhair.com)
      email='support@jussbeautifulhair.com' ;;
    jussco.company|chief-ai.cloudflare.app)
      email='support@jussco.company' ;;
    *)
      printf '%s unsupported-host\n' "$h" >&2
      failed=1
      continue ;;
  esac

  f=$(mktemp) || exit 2
  if ! metadata=$(curl -sS -o "$f" -w '%{http_code}|%{content_type}' --max-time 10 "https://$h/.well-known/security.txt"); then
    printf '%s transport=FAIL\n' "$h"
    rm -f "$f"
    failed=1
    continue
  fi

  http=$(printf '%s' "$metadata" | cut -d'|' -f1)
  mime=$(printf '%s' "$metadata" | cut -d'|' -f2)
  contact=$(grep -Fxc -- "Contact: mailto:$email" "$f" || true)
  canonical=$(grep -Fxc -- "Canonical: https://$h/.well-known/security.txt" "$f" || true)
  expires=$(grep -Fxc -- 'Expires: 2027-06-30T00:00:00.000Z' "$f" || true)
  language=$(grep -Fxc -- 'Preferred-Languages: en' "$f" || true)
  contacts=$(grep -c '^Contact:' "$f" || true)
  canonicals=$(grep -c '^Canonical:' "$f" || true)
  expirations=$(grep -c '^Expires:' "$f" || true)
  languages=$(grep -c '^Preferred-Languages:' "$f" || true)

  status=PASS
  if [ "$http" != '200' ] || [ "$contact" != '1' ] || [ "$canonical" != '1' ] || \
     [ "$expires" != '1' ] || [ "$language" != '1' ] || \
     [ "$contacts" != '1' ] || [ "$canonicals" != '1' ] || \
     [ "$expirations" != '1' ] || [ "$languages" != '1' ]; then
    status=FAIL
  fi
  case "$mime" in
    text/plain*) ;;
    *) status=FAIL ;;
  esac
  printf '%s http=%s contact=%s canonical=%s expires=%s language=%s mime=%s %s\n' \
    "$h" "$http" "$contact" "$canonical" "$expires" "$language" "$mime" "$status"
  if [ "$status" = FAIL ]; then failed=1; fi
  rm -f "$f"
done
exit "$failed"

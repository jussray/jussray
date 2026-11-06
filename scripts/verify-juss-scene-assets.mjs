import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Validate the exact display bytes before updating the receipt or shipping the assets.
export function verifySceneAssets(manifest, readBytes) {
  if (!manifest || !Array.isArray(manifest.assets)) return ['invalid scene manifest'];
  const errors = [];
  for (const item of manifest.assets) {
    const path = item.path;
    if (typeof path !== 'string' || !/^\/assets\/scenes\/[a-zA-Z0-9._-]+\.webp$/.test(path) ||
      path.includes('..')) {
      errors.push('unsafe path: ' + String(path));
      continue;
    }
    let bytes;
    try {
      bytes = readBytes(path);
    } catch {
      errors.push('missing asset: ' + path);
      continue;
    }
    if (!Buffer.isBuffer(bytes)) {
      errors.push('invalid bytes: ' + path);
      continue;
    }
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== item.derivativeSha256) errors.push('hash mismatch: ' + path);
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const siteRoot = resolve(process.env.JUSSCO_SITE_ROOT || new URL('../site/', import.meta.url).pathname);
  const manifest = JSON.parse(readFileSync(join(siteRoot, 'data/juss-world-asset-receipt.json'), 'utf8'));
  const errors = verifySceneAssets(manifest, path => readFileSync(join(siteRoot, path.slice(1))));
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log('Verified all Juss & Co scene asset SHA-256 hashes against the public provenance receipt.');
  }
}

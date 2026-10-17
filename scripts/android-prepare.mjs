import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Remove only redundant gzip copies after validating every required raw file. */
export function pruneOfficeAssets(office) {
  const filenames = ['soffice.wasm.bin.gz', 'soffice.data.bin.gz'];
  if (fs.readdirSync(office).some(name => name.includes('.part_') || name.endsWith('.manifest.json'))) {
    throw new Error('Stale chunked Office assets found. Run a fresh Android build before packaging.');
  }
  for (const filename of filenames) {
    const raw = path.join(office, filename.slice(0, -3));
    if (!fs.existsSync(raw)) throw new Error(`Required uncompressed Office engine missing: ${raw}`);
  }
  const removed = [];
  for (const filename of filenames) {
    const asset = path.join(office, filename);
    if (fs.existsSync(asset)) {
      removed.push({ file: filename, bytes: fs.statSync(asset).size });
      fs.unlinkSync(asset);
    }
  }
  return removed;
}

// Package Android assets without Cloudflare chunking or redundant gzip payloads.
export function prepareAndroidAssets(root = process.cwd()) {
  const out = path.join(root, 'out');
  execFileSync(process.execPath, [path.join(root, 'scripts/decompress-wasm.mjs')], { cwd: root, stdio: 'inherit' });
  execFileSync(process.execPath, [path.join(root, 'scripts/ensure-pdfjs-viewer-js.js'), 'out'], { cwd: root, stdio: 'inherit' });
  const english = JSON.parse(fs.readFileSync(path.join(root, 'messages/en.json'), 'utf8'));
  const merge = (fallback, local) => Object.fromEntries([...new Set([...Object.keys(fallback), ...Object.keys(local)])].map(key => {
    const base = fallback[key], value = local[key];
    return [key, base && value && typeof base === 'object' && typeof value === 'object' && !Array.isArray(base) && !Array.isArray(value)
      ? merge(base, value) : value ?? base];
  }));
  const messagesDir = path.join(out, 'android-messages');
  fs.mkdirSync(messagesDir, { recursive: true });
  for (const filename of fs.readdirSync(path.join(root, 'messages')).filter(name => name.endsWith('.json'))) {
    const messages = merge(english, JSON.parse(fs.readFileSync(path.join(root, 'messages', filename), 'utf8')));
    fs.writeFileSync(path.join(messagesDir, filename), JSON.stringify(messages).replaceAll('PDFCraft', 'FolioKit'));
  }
  const removed = pruneOfficeAssets(path.join(out, 'libreoffice-wasm'));
  console.log(`Android: shared locale files prepared; removed ${(removed.reduce((sum, file) => sum + file.bytes, 0) / 1048576).toFixed(1)} MiB of duplicate gzip assets.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepareAndroidAssets();

import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pruneOfficeAssets } from '../../../scripts/android-prepare.mjs';
const dirs: string[] = [];
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'foliokit-packaging-'));
  dirs.push(dir);
  for (const name of ['soffice.wasm.bin', 'soffice.data.bin']) {
    fs.writeFileSync(path.join(dir, name), 'required engine bytes');
    fs.writeFileSync(path.join(dir, name + '.gz'), 'duplicate');
  }
  fs.writeFileSync(path.join(dir, 'LICENSE'), 'upstream license');
  return dir;
}
afterEach(() => dirs.splice(0).forEach(dir => fs.rmSync(dir, { recursive: true, force: true })));
describe('Android Office engine packaging', () => {
  it('removes only redundant compressed copies, preserving engines and license', () => {
    const dir = fixture();
    expect(pruneOfficeAssets(dir)).toHaveLength(2);
    expect(fs.readdirSync(dir).sort()).toEqual(['LICENSE', 'soffice.data.bin', 'soffice.wasm.bin']);
    expect(fs.readFileSync(path.join(dir, 'soffice.wasm.bin'), 'utf8')).toBe('required engine bytes');
  });
  it('refuses to prune anything if a required engine is missing', () => {
    const dir = fixture();
    fs.unlinkSync(path.join(dir, 'soffice.data.bin'));
    expect(() => pruneOfficeAssets(dir)).toThrow('Required uncompressed');
    expect(fs.existsSync(path.join(dir, 'soffice.wasm.bin.gz'))).toBe(true);
  });
  it('rejects stale Cloudflare chunks', () => {
    const dir = fixture();
    fs.writeFileSync(path.join(dir, 'soffice.wasm.bin.part_0'), 'stale chunk');
    expect(() => pruneOfficeAssets(dir)).toThrow('Stale chunked');
    expect(fs.existsSync(path.join(dir, 'soffice.wasm.bin.gz'))).toBe(true);
  });
});

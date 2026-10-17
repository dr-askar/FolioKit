import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const notices = [];
for (const [location, info] of Object.entries(lock.packages)) {
  if (!location || info.dev) continue;
  const dir = path.resolve(location);
  if (!fs.existsSync(path.join(dir, 'package.json'))) {
    if (info.optional) continue;
    throw new Error(`Missing installed dependency: ${location}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const files = fs.readdirSync(dir).filter(name => /^(licen[cs]e|copying|notice)([.-]|$)/i.test(name));
  notices.push({ name: pkg.name, version: pkg.version, license: pkg.license || info.license || 'REVIEW REQUIRED', repository: pkg.repository || null,
    notices: files.filter(name => fs.statSync(path.join(dir, name)).isFile()).map(name => ({ file: name, text: fs.readFileSync(path.join(dir, name), 'utf8') })) });
}
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const repository = process.env.GITHUB_REPOSITORY || 'dr-askar/FolioKit';
const source = repository ? `https://github.com/${repository}/tree/${revision}` : null;
const metadata = { revision, source, modified: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
  instructions: 'See ANDROID.md. Distribute the complete corresponding source alongside the APK.', contributor: 'Mohammad Askar (dr-askar)' };
for (const target of ['public', 'out']) {
  if (!fs.existsSync(target)) continue;
  fs.writeFileSync(path.join(target, 'third-party-notices.json'), JSON.stringify(notices, null, 2));
  fs.writeFileSync(path.join(target, 'source-info.json'), JSON.stringify(metadata, null, 2));
}
console.log(`Collected notices for ${notices.length} production packages. Bundled WASM and font licenses need separate release review.`);

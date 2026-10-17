import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  stdio: 'inherit', env: { ...process.env, ANDROID_BUILD: 'true', NEXT_PUBLIC_ANDROID_BUILD: 'true', DISABLE_UPDATE_CHECK: 'true' },
});
process.exit(result.status ?? 1);

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.draskar.foliokit',
  appName: 'FolioKit',
  webDir: 'out',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false },
};
export default config;

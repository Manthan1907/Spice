import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rizzretro.app',
  appName: 'RizzRetro AI',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;

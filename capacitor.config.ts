import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bitwiselearning.app',
  appName: 'Bitwise Learning',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;

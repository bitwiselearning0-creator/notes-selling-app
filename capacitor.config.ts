import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bitwiselearning.app',
  appName: 'Bitwise Learning',
  webDir: 'dist',
  server: {
    url: 'https://bitwise-learning.onrender.com?platform=app',
    cleartext: true
  }
};

export default config;

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bakerly.app',
  appName: 'Bakerly',
  webDir: 'dist',
  server: {
    url: 'https://bakerly-app.web.app',
    cleartext: true
  }
};

export default config;
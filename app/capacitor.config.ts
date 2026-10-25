import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pixdone.app',
  appName: 'PixDone',
  webDir: 'dist',
  backgroundColor: '#0A0A22',
  ios: {
    // Keep the WebView inside the safe area so headers don't sit under the
    // status bar / Dynamic Island (the web UI has no safe-area padding yet).
    contentInset: 'always',
  },
  plugins: {
    // Route fetch/XHR through native HTTP so calls to https://pixdone.vercel.app/api
    // are not subject to WebView CORS, and keep the session cookie in the native store.
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true },
  },
};

export default config;

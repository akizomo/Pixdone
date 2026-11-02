import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.pixdone.app',
  appName: 'PixDone',
  webDir: 'dist',
  backgroundColor: '#0A0A22',
  ios: {
    // Edge-to-edge: the web UI pads itself with env(safe-area-inset-*) so the
    // theme background shows behind the status bar / Dynamic Island.
    contentInset: 'never',
  },
  plugins: {
    // index.html uses viewport-fit=cover; hint it so Android doesn't jump on load.
    SystemBars: {
      initialViewportFitValueHint: 'cover',
    },
    // Shrink the WebView above the keyboard so centred dialogs re-centre and
    // fields stay visible (BottomSheet's visualViewport inset then reads ~0).
    Keyboard: {
      resize: KeyboardResize.Native,
    },
    // Hidden from App.tsx once Firebase Auth resolves. launchShowDuration is the
    // safety net if that never happens (e.g. a JS error before mount).
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 10000,
      backgroundColor: '#7B61FF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    // Native sign-in only returns the credential; the Firebase JS SDK owns the session.
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com', 'apple.com'],
    },
    // Route fetch/XHR through native HTTP so calls to https://pixdone.vercel.app/api
    // are not subject to WebView CORS, and keep the session cookie in the native store.
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true },
  },
};

export default config;

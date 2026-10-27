import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyDekUSz8JzAjrOeMu_I-ODUoM46eronrSo',
  authDomain: 'red-girder-465715-n6.firebaseapp.com',
  projectId: 'red-girder-465715-n6',
  storageBucket: 'red-girder-465715-n6.firebasestorage.app',
  messagingSenderId: '516445042682',
  appId: '1:516445042682:web:f66cbcdfb4a00cf2e09643',
  measurementId: 'G-TJBYSY1FDE',
};

const app = initializeApp(firebaseConfig);
// In the native app, getAuth() loads Google's gapi iframe (used for popup/redirect
// sign-in), which fails under capacitor:// and stalls auth initialization for
// seconds. Native sign-in doesn't need it, so initialize without that resolver.
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);
export const db = getFirestore(app);// Analytics はブラウザ環境でのみ初期化（SSR / テスト時はスキップ）
export let analytics: Analytics | null = null;

isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});
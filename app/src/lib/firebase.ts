import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics はブラウザ環境でのみ初期化（SSR / テスト時はスキップ）
export let analytics: Analytics | null = null;

isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});
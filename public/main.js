// main.js
// Firebase設定（ユーザー指定値）
const firebaseConfig = {
  apiKey: "AIzaSyDekUSz8JzAjrOeMu_I-ODUoM46eronrSo",
  authDomain: "red-girder-465715-n6.firebaseapp.com",
  projectId: "red-girder-465715-n6",
  storageBucket: "red-girder-465715-n6.firebasestorage.app",
  messagingSenderId: "516445042682",
  appId: "1:516445042682:web:f66cbcdfb4a00cf2e09643",
  measurementId: "G-TJBYSY1FDE"
};

// Firebase初期化
if (firebaseConfig && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// ...（以降のロジックはそのまま）... 
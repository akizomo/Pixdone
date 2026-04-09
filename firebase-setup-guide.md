# Firebase設定ガイド

## 1. Firebase プロジェクトの作成

1. https://console.firebase.google.com/ にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力（例：PixDone）
4. Google Analytics は必要に応じて設定（オフでも可）

## 2. Web アプリの追加

1. プロジェクトのダッシュボードで「アプリを追加」をクリック
2. Web アイコン（</>）を選択
3. アプリの名前を入力（例：PixDone Web）
4. 「アプリを登録」をクリック

## 3. SDK設定の確認

Web アプリを追加すると、以下のような設定コードが表示されます：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB-abc123...",  // ← これが VITE_FIREBASE_API_KEY
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",  // ← これが VITE_FIREBASE_PROJECT_ID
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."  // ← これが VITE_FIREBASE_APP_ID
};
```

## 4. Authentication の有効化

1. 左メニューの「Authentication」をクリック
2. 「始める」をクリック
3. 「Sign-in method」タブを選択
4. 「メール/パスワード」を選択
5. 「有効にする」をオンにして「保存」

## 5. 設定の再確認

もし設定コードを見失った場合：

1. プロジェクトのダッシュボードに戻る
2. 左上の歯車アイコン → 「プロジェクトの設定」
3. 下にスクロールして「マイアプリ」セクションを探す
4. 作成したWebアプリの名前をクリック
5. 「SDK の設定と構成」で設定コードを確認

## 必要な値

- **VITE_FIREBASE_API_KEY**: `apiKey` の値
- **VITE_FIREBASE_PROJECT_ID**: `projectId` の値  
- **VITE_FIREBASE_APP_ID**: `appId` の値

これらの値をコピーして、Replitの環境変数として設定してください。
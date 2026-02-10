/**
 * Firebase Configuration for PixDone
 * Handles authentication with email verification
 */

// Firebase configuration will be loaded from environment variables
const firebaseConfig = {
    apiKey: window.FIREBASE_API_KEY,
    authDomain: `${window.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: window.FIREBASE_PROJECT_ID,
    storageBucket: `${window.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    appId: window.FIREBASE_APP_ID,
};

// Initialize Firebase
if (firebaseConfig && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// Firestoreインスタンスをグローバルに公開
window.db = firebase.firestore();
const auth = firebase.auth();

// Firebase Authentication Handler
class FirebaseAuthHandler {
    constructor() {
        this.auth = auth;
        this.currentUser = null;
        this.isInitialized = false;
        
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            // handleAuthStateChangeは不要なので何もしない
        });
        
        this.isInitialized = true;
    }
    
    async register(email, password) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Send email verification
            await user.sendEmailVerification();
            
            return {
                success: true,
                message: 'Verification email sent! Please check your email and click the link to activate your account.\n\nIf you don\'t see the email, please check your spam folder.',
                needsVerification: true
            };
        } catch (error) {
            return {
                success: false,
                message: this.getErrorMessage(error.code)
            };
        }
    }
    
    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            if (!user.emailVerified) {
                await this.logout();
                return {
                    success: false,
                    message: 'Email address not verified. Please check your email and spam folder for the verification link.'
                };
            }
            
            return {
                success: true,
                message: 'Successfully logged in!',
                user: {
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified
                }
            };
        } catch (error) {
            return {
                success: false,
                message: this.getErrorMessage(error.code)
            };
        }
    }
    
    async logout() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, message: 'ログアウトに失敗しました' };
        }
    }
    
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            
            return {
                success: true,
                message: 'パスワードリセットメールを送信しました。メールボックスをチェックして、リンクをクリックしてパスワードを再設定してください。'
            };
        } catch (error) {
            return {
                success: false,
                message: this.getErrorMessage(error.code)
            };
        }
    }
    
    async deleteAccount() {
        try {
            if (this.currentUser) {
                await this.currentUser.delete();
                return { success: true };
            }
            return { success: false, message: 'ユーザーが見つかりません' };
        } catch (error) {
            return { success: false, message: 'アカウント削除に失敗しました' };
        }
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isAuthenticated() {
        return this.currentUser && this.currentUser.emailVerified;
    }
    
    getErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'このメールアドレスは既に使用されています';
            case 'auth/invalid-email':
                return '無効なメールアドレスです';
            case 'auth/weak-password':
                return 'パスワードが弱すぎます（6文字以上必要）';
            case 'auth/user-not-found':
                return 'ユーザーが見つかりません';
            case 'auth/wrong-password':
                return 'パスワードが間違っています';
            case 'auth/invalid-credential':
                return 'メールアドレスまたはパスワードが間違っています';
            case 'auth/user-not-found':
                return 'このメールアドレスのアカウントが見つかりません';
            case 'auth/too-many-requests':
                return 'リクエストが多すぎます。しばらく待ってから再試行してください';
            default:
                return '認証エラーが発生しました';
        }
    }
}

// Global instance
window.firebaseAuth = new FirebaseAuthHandler();
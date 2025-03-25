import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase設定のインターフェース
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

let firebaseApp: FirebaseApp | undefined;
let firestoreInstance: Firestore | undefined;
let authInstance: Auth | undefined;

// Firebase初期化関数
export const initializeFirebase = (config: FirebaseConfig): FirebaseApp => {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(config);
  }
  return firebaseApp ?? getApps()[0];
};

// Firebase認証インスタンスを取得
export const getFirebaseAuth = (app?: FirebaseApp): Auth => {
  if (!authInstance) {
    const appInstance = app ?? firebaseApp;
    if (appInstance) {
      authInstance = getAuth(appInstance);
    } else {
      // アプリが初期化されていない場合、デフォルトアプリを使用
      authInstance = getAuth();
    }
  }
  return authInstance;
};

// Firestoreインスタンスを取得
export const getFirebaseFirestore = (app?: FirebaseApp): Firestore => {
  if (!firestoreInstance) {
    const appInstance = app ?? firebaseApp;
    if (appInstance) {
      firestoreInstance = getFirestore(appInstance);
    } else {
      // アプリが初期化されていない場合、デフォルトアプリを使用
      firestoreInstance = getFirestore();
    }
  }
  return firestoreInstance;
};

// 環境変数からFirebase設定を取得
export const getFirebaseConfig = (): FirebaseConfig => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  // クライアント側での実行の場合のみチェック
  if (typeof window !== 'undefined') {
    const missingVars = requiredEnvVars.filter(
      (name) => typeof process.env[name] === 'undefined'
    );

    if (missingVars.length > 0) {
      throw new Error(`Missing Firebase configuration: ${missingVars.join(', ')}`);
    }
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
};
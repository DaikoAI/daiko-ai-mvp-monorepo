import {
  COLLECTIONS,
  getFirebaseAuth,
  getFirebaseConfig,
  getFirebaseFirestore,
  initializeFirebase,
  User,
} from "@daiko-ai/shared";
import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { doc, Firestore, getDoc, setDoc, updateDoc } from "firebase/firestore";

// Firebaseの初期化
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

// Firebaseの初期化関数
export const initFirebase = () => {
  if (typeof window !== "undefined" && !app) {
    try {
      const config = getFirebaseConfig();
      app = initializeFirebase(config);
      auth = getFirebaseAuth(app);
      firestore = getFirebaseFirestore(app);
    } catch (error) {
      console.error("Firebase initialization error:", error);
    }
  }
  return { app, auth, firestore };
};

// ユーザープロファイルの取得
export const getUser = async (uid: string): Promise<User | null> => {
  const { firestore } = initFirebase();
  if (!firestore) return null;

  try {
    const userDocRef = doc(firestore, COLLECTIONS.USER_PROFILES, uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// ユーザープロファイルの作成または更新
export const saveUser = async (profile: User): Promise<boolean> => {
  const { firestore } = initFirebase();
  if (!firestore) return false;

  try {
    const userDocRef = doc(firestore, COLLECTIONS.USER_PROFILES, profile.walletAddress);

    // 既存のプロファイルをチェック
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // 既存のプロファイルを更新
      await updateDoc(userDocRef, {
        ...profile,
        updatedAt: new Date(),
      });
    } else {
      // 新しいプロファイルを作成
      await setDoc(userDocRef, {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error saving user profile:", error);
    return false;
  }
};

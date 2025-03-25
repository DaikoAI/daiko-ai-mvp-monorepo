import { initializeFirebase, getFirebaseAuth, getFirebaseFirestore, getFirebaseConfig } from '@daiko-ai/shared';
import { FirebaseApp } from 'firebase/app';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { COLLECTIONS, UserProfile } from '@daiko-ai/shared';

// Firebaseの初期化
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

// Firebaseの初期化関数
export const initFirebase = () => {
  if (typeof window !== 'undefined' && !app) {
    try {
      const config = getFirebaseConfig();
      app = initializeFirebase(config);
      auth = getFirebaseAuth(app);
      firestore = getFirebaseFirestore(app);
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }
  return { app, auth, firestore };
};

// 認証状態の監視
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  const { auth } = initFirebase();
  if (!auth) return () => {};

  return onAuthStateChanged(auth, callback);
};

// ユーザープロファイルの取得
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const { firestore } = initFirebase();
  if (!firestore) return null;

  try {
    const userDocRef = doc(firestore, COLLECTIONS.USER_PROFILES, uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// ユーザープロファイルの作成または更新
export const saveUserProfile = async (profile: UserProfile): Promise<boolean> => {
  const { firestore } = initFirebase();
  if (!firestore) return false;

  try {
    const userDocRef = doc(firestore, COLLECTIONS.USER_PROFILES, profile.uid);

    // 既存のプロファイルをチェック
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // 既存のプロファイルを更新
      await updateDoc(userDocRef, {
        ...profile,
        updatedAt: new Date()
      });
    } else {
      // 新しいプロファイルを作成
      await setDoc(userDocRef, {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
};

// ニュース記事の取得
export const getLatestNews = async (limit = 10) => {
  const { firestore } = initFirebase();
  if (!firestore) return [];

  try {
    const newsCollection = collection(firestore, COLLECTIONS.NEWS);
    const q = query(newsCollection);
    const querySnapshot = await getDocs(q);

    const news = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
        const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);

    return news;
  } catch (error) {
    console.error('Error getting latest news:', error);
    return [];
  }
};

// X(Twitter)ツイートの取得
export const getLatestTweets = async (limit = 10) => {
  const { firestore } = initFirebase();
  if (!firestore) return [];

  try {
    const tweetsCollection = collection(firestore, COLLECTIONS.TWEETS);
    const q = query(tweetsCollection);
    const querySnapshot = await getDocs(q);

    const tweets = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);

    return tweets;
  } catch (error) {
    console.error('Error getting latest tweets:', error);
    return [];
  }
};

// ユーザー興味に基づくニュース記事の取得
export const getNewsForUser = async (userProfile: UserProfile, limit = 10) => {
  const { firestore } = initFirebase();
  if (!firestore) return [];

  try {
    const newsCollection = collection(firestore, COLLECTIONS.NEWS);
    let q = query(newsCollection);

    // 興味やカテゴリが設定されている場合はフィルタリング
    if (userProfile.preferredCategories && userProfile.preferredCategories.length > 0) {
      q = query(newsCollection, where('categories', 'array-contains-any', userProfile.preferredCategories));
    }

    const querySnapshot = await getDocs(q);

    const news = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
        const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);

    return news;
  } catch (error) {
    console.error('Error getting news for user:', error);
    return [];
  }
};
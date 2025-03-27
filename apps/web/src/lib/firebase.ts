import { COLLECTIONS, getAdminFirestore, TradeProposal, User } from "@daiko-ai/shared";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const db = getAdminFirestore();

export const getProposals = async () => {
  const proposalCollection = db.collection(COLLECTIONS.TRADE_PROPOSALS);
  const snapshot = await proposalCollection.get();
  return snapshot.docs.map((doc) => doc.data()) as TradeProposal[];
};

// ユーザープロファイルの取得
export const getUser = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await db.collection(COLLECTIONS.USER_PROFILES).doc(uid).get();

    if (userDoc.exists) {
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
  try {
    const userCollection = db.collection(COLLECTIONS.USER_PROFILES);
    const userDocRef = userCollection.doc(profile.walletAddress);

    // 既存のプロファイルをチェック
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      // 既存のプロファイルを更新
      await userDocRef.update({
        ...profile,
        updatedAt: new Date(),
      });
    } else {
      // 新しいプロファイルを作成
      await userDocRef.set({
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

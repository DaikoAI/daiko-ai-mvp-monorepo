import { cert, initializeApp, ServiceAccount, type App } from "firebase-admin/app";
import { CollectionReference, DocumentReference, getFirestore, Query, type Firestore } from "firebase-admin/firestore";

export class FirebaseBase {
  public app: App;
  public db: Firestore;

  constructor() {
    try {
      // 環境変数からサービスアカウント情報を取得
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Base64エンコードされたサービスアカウントJSONをデコード
        const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "base64").toString());
        this.app = initializeApp({
          credential: cert(serviceAccount as ServiceAccount),
        });
      } else if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
      ) {
        // 個別の環境変数から認証情報を構築
        this.app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          } as ServiceAccount),
        });
      } else {
        throw new Error("Firebase configuration is missing");
      }
      this.db = getFirestore(this.app);
    } catch (error) {
      console.error("Firebase initialization error:", error);
      throw new Error("Failed to initialize Firebase");
    }
  }

  public async addDocument<T extends Record<string, any>>(collection: string, data: T): Promise<string> {
    const docRef = await this.db.collection(collection).add({
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  }

  public async getDocuments<T>(
    collection: string,
    whereConditions?: [string, FirebaseFirestore.WhereFilterOp, any][],
  ): Promise<T[]> {
    let query: Query = this.db.collection(collection);

    if (whereConditions) {
      for (const [field, op, value] of whereConditions) {
        query = query.where(field, op, value);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  public async updateDocument(collection: string, docId: string, data: Partial<Record<string, any>>): Promise<void> {
    await this.db
      .collection(collection)
      .doc(docId)
      .update({
        ...data,
        updatedAt: new Date(),
      });
  }

  // コレクションの型付きリファレンスを取得するヘルパー
  public getCollectionRef<T>(collectionPath: string): CollectionReference<T> {
    return this.db.collection(collectionPath) as CollectionReference<T>;
  }

  // ドキュメントの型付きリファレンスを取得するヘルパー
  public getDocumentRef<T>(collectionPath: string, documentId: string): DocumentReference<T> {
    return this.db.collection(collectionPath).doc(documentId) as DocumentReference<T>;
  }
}

// シングルトンインスタンス
let firebaseInstance: FirebaseBase | null = null;

// Firebaseインスタンスを取得する関数
export const getFirebaseAdmin = (): FirebaseBase => {
  if (!firebaseInstance) {
    firebaseInstance = new FirebaseBase();
  }
  return firebaseInstance;
};

// Firestoreインスタンスを取得
export const getAdminFirestore = (): Firestore => {
  return getFirebaseAdmin().db;
};

// コレクションの型付きリファレンスを取得するヘルパー
export const getCollectionRef = <T>(collectionPath: string): CollectionReference<T> => {
  return getFirebaseAdmin().getCollectionRef<T>(collectionPath);
};

// ドキュメントの型付きリファレンスを取得するヘルパー
export const getDocumentRef = <T>(collectionPath: string, documentId: string): DocumentReference<T> => {
  return getFirebaseAdmin().getDocumentRef<T>(collectionPath, documentId);
};

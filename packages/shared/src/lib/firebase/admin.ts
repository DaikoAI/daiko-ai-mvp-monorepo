import { cert, getApp, getApps, initializeApp, ServiceAccount, type App } from "firebase-admin/app";
import { CollectionReference, DocumentReference, getFirestore, Query, type Firestore } from "firebase-admin/firestore";

export class FirebaseBase {
  public app: App;
  public db: Firestore;

  constructor(appName: string = "default") {
    try {
      // 必須の環境変数をチェック
      const requiredEnvVars = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];

      const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
      }

      // 既存のアプリケーションをチェック
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.app = getApp(appName);
        this.db = getFirestore(this.app);
        return;
      }

      // 新規アプリケーションの初期化
      const credential: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // 改行文字を適切に処理
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
      };

      this.app = initializeApp(
        {
          credential: cert(credential),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
        },
        appName,
      );

      this.db = getFirestore(this.app);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Firebase initialization error:", errorMessage);
      throw new Error(`Failed to initialize Firebase: ${errorMessage}`);
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

// シングルトンインスタンスの管理
const firebaseInstances: { [key: string]: FirebaseBase } = {};

export const getFirebaseAdmin = (appName: string = "default"): FirebaseBase => {
  if (!firebaseInstances[appName]) {
    firebaseInstances[appName] = new FirebaseBase(appName);
  }
  return firebaseInstances[appName];
};

// Firestoreインスタンスを直接取得するユーティリティ関数
export const getAdminFirestore = (appName: string = "default"): Firestore => {
  return getFirebaseAdmin(appName).db;
};

// コレクションの型付きリファレンスを取得するヘルパー
export const getCollectionRef = <T>(collectionPath: string): CollectionReference<T> => {
  return getFirebaseAdmin().getCollectionRef<T>(collectionPath);
};

// ドキュメントの型付きリファレンスを取得するヘルパー
export const getDocumentRef = <T>(collectionPath: string, documentId: string): DocumentReference<T> => {
  return getFirebaseAdmin().getDocumentRef<T>(collectionPath, documentId);
};

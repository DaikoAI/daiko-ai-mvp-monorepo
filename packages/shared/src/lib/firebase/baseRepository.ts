import type { DocumentData, FirestoreDataConverter, SetOptions, WhereFilterOp } from "firebase-admin/firestore";
import type { CollectionName } from "../../types/db";
import { getAdminFirestore } from "./admin";

/**
 * Firebaseコレクションの基本操作を提供する汎用リポジトリクラス
 * @template T - ドキュメントの型
 */
export class BaseRepository<T extends { id?: string }> {
  protected readonly db = getAdminFirestore();
  protected readonly collectionName: CollectionName;
  protected readonly converter: FirestoreDataConverter<T>;

  /**
   * @param collectionName - 操作対象のコレクション名
   */
  constructor(collectionName: CollectionName) {
    this.collectionName = collectionName;

    // 型変換用のコンバーター
    this.converter = {
      toFirestore(data: T): DocumentData {
        const { id, ...rest } = data;
        return {
          ...rest,
          updatedAt: new Date(),
        };
      },
      fromFirestore(snapshot): T {
        const data = snapshot.data()!;
        return {
          ...data,
          id: snapshot.id,
        } as T;
      },
    };
  }

  /**
   * コレクションの参照を取得
   */
  protected getCollection() {
    return this.db.collection(this.collectionName).withConverter(this.converter);
  }

  /**
   * ドキュメントの参照を取得
   */
  protected getDocRef(id: string) {
    return this.getCollection().doc(id);
  }

  /**
   * 新規ドキュメントを作成
   * @param data - 保存するデータ
   * @returns 作成されたドキュメントのID
   */
  async create(data: Omit<T, "id">): Promise<string> {
    const docData = {
      ...data,
      createdAt: new Date(),
    } as unknown as T;

    const docRef = await this.getCollection().add(docData);
    return docRef.id;
  }

  /**
   * ドキュメントを取得
   * @param id - ドキュメントID
   * @returns 取得したドキュメントデータ、存在しない場合はnull
   */
  async findById(id: string): Promise<T | null> {
    const docSnap = await this.getDocRef(id).get();
    if (!docSnap.exists) {
      return null;
    }
    return docSnap.data() as T;
  }

  /**
   * 指定した条件でドキュメントを検索
   * @param field - 検索するフィールド名
   * @param operator - 比較演算子
   * @param value - 比較対象の値
   * @returns 検索結果のドキュメントリスト
   */
  async findWhere(field: string, operator: WhereFilterOp, value: any): Promise<T[]> {
    const snapshot = await this.getCollection().where(field, operator, value).get();
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * コレクション内の全ドキュメントを取得
   * @returns すべてのドキュメントリスト
   */
  async findAll(): Promise<T[]> {
    const snapshot = await this.getCollection().get();
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * ドキュメントを更新
   * @param id - 更新するドキュメントのID
   * @param data - 更新するデータ
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.getDocRef(id).update(updateData);
  }

  /**
   * ドキュメントを置換または作成
   * @param id - ドキュメントID
   * @param data - 保存するデータ
   * @param options - 設定オプション
   */
  async set(id: string, data: T, options?: SetOptions): Promise<void> {
    const setData = {
      ...data,
      updatedAt: new Date(),
    };

    if (options) {
      await this.getDocRef(id).set(setData, options);
    } else {
      await this.getDocRef(id).set(setData);
    }
  }

  /**
   * ドキュメントを削除
   * @param id - 削除するドキュメントのID
   */
  async delete(id: string): Promise<void> {
    await this.getDocRef(id).delete();
  }

  /**
   * フィールドの値でドキュメントを検索（最初の1件）
   * @param field - 検索するフィールド名
   * @param value - 検索する値
   * @returns 検索結果のドキュメント、存在しない場合はnull
   */
  async findOneByField(field: string, value: any): Promise<T | null> {
    const snapshot = await this.getCollection().where(field, "==", value).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }
}

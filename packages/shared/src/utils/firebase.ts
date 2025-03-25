import { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

/**
 * FirestoreのTimestampをDateに変換するコンバーター
 */
export const firestoreConverter = <T extends DocumentData>() => ({
  toFirestore: (data: T) => {
    // Date型をTimestampに変換
    const processedData: Record<string, any> = { ...data };

    // すべてのフィールドをチェックして変換
    Object.keys(processedData).forEach((key) => {
      const value = processedData[key];

      if (value instanceof Date) {
        processedData[key] = Timestamp.fromDate(value);
      }
      // 配列の場合は各要素をチェック
      else if (Array.isArray(value)) {
        processedData[key] = value.map((item) => (item instanceof Date ? Timestamp.fromDate(item) : item));
      }
      // オブジェクトの場合は再帰的に処理
      else if (value && typeof value === "object" && !(value instanceof Timestamp)) {
        processedData[key] = processObject(value);
      }
    });

    return processedData;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): T => {
    const data = snapshot.data() as Record<string, any>;

    // すべてのフィールドをチェックして変換
    Object.keys(data).forEach((key) => {
      const value = data[key];

      if (value instanceof Timestamp) {
        data[key] = value.toDate();
      }
      // 配列の場合は各要素をチェック
      else if (Array.isArray(value)) {
        data[key] = value.map((item) => (item instanceof Timestamp ? item.toDate() : item));
      }
      // オブジェクトの場合は再帰的に処理
      else if (value && typeof value === "object" && !(value instanceof Date)) {
        data[key] = processObjectFromFirestore(value);
      }
    });

    return {
      ...data,
      id: snapshot.id,
    } as unknown as T;
  },
});

// オブジェクトをFirestore用に処理する再帰関数
const processObject = (obj: Record<string, any>): Record<string, any> => {
  const result = { ...obj };

  Object.keys(result).forEach((key) => {
    const value = result[key];

    if (value instanceof Date) {
      result[key] = Timestamp.fromDate(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item instanceof Date ? Timestamp.fromDate(item) : item && typeof item === "object" ? processObject(item) : item,
      );
    } else if (value && typeof value === "object" && !(value instanceof Timestamp)) {
      result[key] = processObject(value);
    }
  });

  return result;
};

// Firestoreから取得したオブジェクトを処理する再帰関数
const processObjectFromFirestore = (obj: Record<string, any>): Record<string, any> => {
  const result = { ...obj };

  Object.keys(result).forEach((key) => {
    const value = result[key];

    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item instanceof Timestamp
          ? item.toDate()
          : item && typeof item === "object"
            ? processObjectFromFirestore(item)
            : item,
      );
    } else if (value && typeof value === "object" && !(value instanceof Date)) {
      result[key] = processObjectFromFirestore(value);
    }
  });

  return result;
};

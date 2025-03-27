import type { ChangeLog, NotificationLog, XAccount } from "@daiko-ai/shared";
import { COLLECTIONS, getAdminFirestore } from "@daiko-ai/shared";

// Firestoreの参照を取得
const db = getAdminFirestore();

// XAccounts関連の操作
export const xAccountsCollection = db.collection(COLLECTIONS.X_ACCOUNTS);

export const getAllXAccounts = async (): Promise<XAccount[]> => {
  try {
    const snapshot = await xAccountsCollection.get();
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as XAccount,
    );
  } catch (error) {
    console.error("Error getting all X accounts:", error);
    return [];
  }
};

export const saveXAccount = async (account: XAccount): Promise<void> => {
  try {
    await xAccountsCollection.doc(account.id).set(
      {
        ...account,
        updatedAt: new Date(),
      },
      { merge: true },
    );
    console.info(`Saved X account: ${account.id}`);
  } catch (error) {
    console.error(`Error saving X account ${account.id}:`, { error });
    throw error;
  }
};

// 変更ログの操作
export const changeLogsCollection = db.collection(COLLECTIONS.CHANGE_LOGS);

export const saveChangeLog = async (log: ChangeLog): Promise<void> => {
  try {
    const newLogRef = await changeLogsCollection.add({
      ...log,
      createdAt: new Date(),
    });
    console.info(`Saved change log for ${log.xid} with ID: ${newLogRef.id}`);

    // 古いログを削除（最新100件のみ保持）
    const snapshot = await changeLogsCollection.orderBy("timestamp", "asc").limit(1000).get();

    if (snapshot.docs.length > 100) {
      // 古いものから削除
      const docsToDelete = snapshot.docs.slice(0, snapshot.docs.length - 100);

      // バッチ処理で一度に削除
      const batch = db.batch();
      for (const doc of docsToDelete) {
        batch.delete(doc.ref);
      }
      await batch.commit();

      console.info(`Removed ${docsToDelete.length} old change logs`);
    }
  } catch (error) {
    console.error(`Error saving change log for ${log.xid}:`, { error });
    throw error;
  }
};

// 通知ログの操作
export const notificationLogsCollection = db.collection("notificationLogs");

export const saveNotificationLog = async (log: NotificationLog): Promise<void> => {
  try {
    const newLogRef = await notificationLogsCollection.add({
      ...log,
      createdAt: new Date(),
    });
    console.info(`Saved notification log for ${log.accountId} with ID: ${newLogRef.id}`);

    // 古いログを削除（最新100件のみ保持）
    const snapshot = await notificationLogsCollection.orderBy("timestamp", "asc").limit(1000).get();

    if (snapshot.docs.length > 100) {
      // 古いものから削除
      const docsToDelete = snapshot.docs.slice(0, snapshot.docs.length - 100);

      // バッチ処理で一度に削除
      const batch = db.batch();
      for (const doc of docsToDelete) {
        batch.delete(doc.ref);
      }
      await batch.commit();

      console.info(`Removed ${docsToDelete.length} old notification logs`);
    }
  } catch (error) {
    console.error(`Error saving notification log for ${log.accountId}:`, { error });
    throw error;
  }
};

// システムログの操作
export const systemLogsCollection = db.collection("systemLogs");

export const saveSystemLog = async (action: string): Promise<void> => {
  try {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      createdAt: new Date(),
    };

    const newLogRef = await systemLogsCollection.add(log);
    console.info(`Saved system log: ${action} with ID: ${newLogRef.id}`);
  } catch (error) {
    console.error(`Error saving system log (${action}):`, { error });
  }
};

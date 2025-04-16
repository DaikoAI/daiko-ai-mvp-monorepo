import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { db } from "../db";
import { pushSubscriptionTable } from "../db/schema/push_subscriptions";

// Push通知のペイロードの型定義
interface ProposalNotificationPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Web Push の設定
webpush.setVapidDetails(
  "mailto:" + process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendPushNotificationParams {
  userIds: string[];
  notification: PushNotificationPayload;
}

// Push通知を送信する関数
export async function sendProposalNotification(
  subscription: webpush.PushSubscription,
  payload: ProposalNotificationPayload,
) {
  try {
    // 通知ペイロードの作成
    const notificationPayload = {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/pwa/manifest-icon-192.maskable.png",
        badge: "/pwa/manifest-icon-192.maskable.png",
        data: {
          url: payload.url,
        },
        actions: [
          {
            action: "open",
            title: "提案を確認",
          },
        ],
      },
    };

    // Push通知の送信
    await webpush.sendNotification(subscription, JSON.stringify(notificationPayload));

    return { success: true };
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return { success: false, error };
  }
}

// 複数のサブスクリプションに通知を送信する関数
export async function sendProposalNotificationToAll(
  subscriptions: webpush.PushSubscription[],
  payload: ProposalNotificationPayload,
) {
  const results = await Promise.allSettled(
    subscriptions.map((subscription) => sendProposalNotification(subscription, payload)),
  );

  // 成功と失敗の数を集計
  const summary = results.reduce(
    (acc, result) => {
      if (result.status === "fulfilled" && result.value.success) {
        acc.successful++;
      } else {
        acc.failed++;
      }
      return acc;
    },
    { successful: 0, failed: 0 },
  );

  return summary;
}

export const generateVapidKeys = () => {
  return webpush.generateVAPIDKeys();
};

export const setVapidDetails = (subject: string, publicKey: string, privateKey: string) => {
  webpush.setVapidDetails(subject, publicKey, privateKey);
};

export const sendPushNotification = async (subscription: PushSubscription, payload: NotificationPayload) => {
  try {
    await webpush.sendNotification(subscription as webpush.PushSubscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
};

/**
 * 指定されたユーザーIDのリストに対してプッシュ通知を送信する
 */
export async function sendPushNotifications({ userIds, notification }: SendPushNotificationParams): Promise<void> {
  try {
    // ユーザーIDに紐づくプッシュ通知サブスクリプションを取得
    const subscriptions = await db
      .select()
      .from(pushSubscriptionTable)
      .where(inArray(pushSubscriptionTable.userId, userIds));

    // 各サブスクリプションに対して通知を送信
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            data: notification.data,
          });

          await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          // 無効なサブスクリプションの場合は削除を検討
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.delete(pushSubscriptionTable).where(eq(pushSubscriptionTable.endpoint, subscription.endpoint));
          }
          console.error(`Failed to send notification to subscription ${subscription.endpoint}:`, error);
        }
      }),
    );
  } catch (error) {
    console.error("Failed to send push notifications:", error);
    throw new Error("Failed to send push notifications");
  }
}

/**
 * プッシュ通知の送信をテストする
 */
export async function testPushNotification(userId: string): Promise<void> {
  await sendPushNotifications({
    userIds: [userId],
    notification: {
      title: "Test Notification",
      body: "This is a test notification",
      data: {
        type: "test",
        timestamp: new Date().toISOString(),
      },
    },
  });
}

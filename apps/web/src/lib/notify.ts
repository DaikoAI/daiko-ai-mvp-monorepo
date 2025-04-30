"use server";

import { db, pushSubscriptionTable } from "@daiko-ai/shared";
import { eq } from "drizzle-orm";
import * as webPush from "web-push";
import { env } from "@/env";

// Configure web-push
if (env.NODE_ENV === "production") {
  if (!env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY || !env.WEB_PUSH_VAPID_PRIVATE_KEY) {
    console.error("VAPID keys must be set in production environment");
  } else {
    webPush.setVapidDetails(
      "mailto:your-email@example.com", // TODO: Replace with actual contact email
      env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
      env.WEB_PUSH_VAPID_PRIVATE_KEY,
    );
  }
}

/**
 * Sends a web push notification to a specific user.
 * @param userId - The ID of the user to notify.
 * @param payload - The notification payload (title, body, etc.).
 */
export async function sendWebPush(userId: string, payload: object): Promise<void> {
  const subscriptions = await db.select().from(pushSubscriptionTable).where(eq(pushSubscriptionTable.userId, userId));

  if (!subscriptions.length) {
    console.log(`No push subscriptions found for user ${userId}`);
    return;
  }

  const notificationPayload = JSON.stringify(payload);

  const sendPromises = subscriptions.map(async (sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };
    try {
      console.log(`Sending push notification to endpoint: ${sub.endpoint.substring(0, 30)}... for user ${userId}`);
      await webPush.sendNotification(pushSubscription, notificationPayload);
      console.log(`Successfully sent push notification for user ${userId}`);
    } catch (error: any) {
      console.error(`Error sending push notification to user ${userId}:`, error.statusCode, error.body);
      // Handle specific errors, e.g., 410 Gone indicates the subscription is no longer valid
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`Subscription ${sub.endpoint.substring(0, 30)}... is invalid, removing from DB.`);
        await db.delete(pushSubscriptionTable).where(eq(pushSubscriptionTable.endpoint, sub.endpoint));
      }
    }
  });

  await Promise.allSettled(sendPromises);
}

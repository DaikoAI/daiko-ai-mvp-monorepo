import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Add Push Notification Event Listeners

// プッシュ通知受信時の処理
self.addEventListener("push", (event: PushEvent) => {
  console.log("[Service Worker] Push Received.");
  if (!event.data) {
    console.error("[Service Worker] Push event but no data");
    return;
  }

  try {
    const data = event.data.json(); // バックエンドから送られるJSONペイロードを期待
    console.log("[Service Worker] Push data:", data);

    const title = data.title || "New Notification"; // デフォルトタイトル
    const options: NotificationOptions & { data: any } = {
      body: data.body || "You have a new update.", // デフォルト本文
      icon: data.icon || "/pwa/manifest-icon-192.maskable.png", // デフォルトアイコン
      badge: data.badge || "/pwa/manifest-icon-192.maskable.png", // バッジアイコン (Android)
      data: {
        url: data.url || "/", // 通知クリック時に開くURL (必須に近い)
      },
    };

    // 通知を表示
    const promiseChain = self.registration.showNotification(title, options);
    event.waitUntil(promiseChain);
  } catch (error) {
    console.error("[Service Worker] Error processing push event data:", error);
    const title = "New Notification";
    const options: NotificationOptions = {
      body: event.data.text() || "You have a new update.", // テキストとして表示試行
      icon: "/pwa/manifest-icon-192.maskable.png",
      badge: "/pwa/manifest-icon-192.maskable.png",
      data: { url: "/" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// プッシュ通知クリック時の処理
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  console.log("[Service Worker] Notification click Received.");

  event.notification.close(); // 通知を閉じる

  const urlToOpen = event.notification.data?.url || "/";

  const promiseChain = self.clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((clientList: readonly WindowClient[]) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);

        if (clientUrl.pathname === targetUrl.pathname && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

// オプション: プッシュ購読が変更されたときのイベント (デバッグ用など)
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("[Service Worker]: 'pushsubscriptionchange' event fired.");
});

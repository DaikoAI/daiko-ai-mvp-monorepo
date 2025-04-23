import { env } from "@/env";
import { api } from "@/trpc/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | null;
  subscribe: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  subscription: PushSubscription | null;
  isRegistered: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Check for browser support on mount
  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    } else {
      setIsSupported(false);
    }
  }, []);

  // Detect existing browser subscription on mount when permission granted
  useEffect(() => {
    if (isSupported && permission === "granted") {
      navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((existing) => {
          if (existing) {
            console.log("Found existing subscription:", existing);
            setSubscription(existing);
          }
        })
        .catch((err) => {
          console.error("Error fetching existing subscription:", err);
        });
    }
  }, [isSupported, permission]);

  // tRPC mutation hook
  const subscribeMutation = api.push.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Notifications enabled and registered successfully!");
      setError(null);
      // Note: We don't automatically set isSubscribed=true here,
      // rely on the subscription state variable being set after subscribe() succeeds.
      // Or potentially, a parent component could manage the global subscribed state.
    },
    onError: (err) => {
      console.error("Error registering push subscription:", err);
      const message = err.message.includes("Failed to save subscription")
        ? "Failed to save notification settings on the server."
        : `Failed to register notification: ${err.message}`;
      setError(message);
      toast.error(message);
      // Attempt to unsubscribe the browser if server registration failed
      if (subscription) {
        subscription.unsubscribe().then(() => {
          console.log("Unsubscribed client-side after server error.");
          setSubscription(null); // Clear local subscription state
        });
      }
    },
  });

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      const message = "Your browser does not support notifications.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null); // Clear previous errors
    let currentSubscription: PushSubscription | null = null;

    try {
      // Request permission
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === "granted") {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log("Already subscribed:", existingSubscription);
          setSubscription(existingSubscription);
          toast.info("Notifications are already enabled for this browser.");
          // Optionally: Send the existing subscription to backend to ensure it's up-to-date?
          // subscribeMutation.mutate({...});
          return; // Exit if already subscribed
        }

        // Subscribe
        currentSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
        });
        setSubscription(currentSubscription);
        console.log("New Push subscription:", currentSubscription);

        const subscriptionData = currentSubscription.toJSON();
        if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
          throw new Error("Subscription object is missing required fields.");
        }

        // Send to backend
        subscribeMutation.mutate({
          endpoint: subscriptionData.endpoint,
          keys: {
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth,
          },
          userAgent: navigator.userAgent,
        });
      } else if (currentPermission === "denied") {
        const message = "Notification permission denied. Please enable it in your browser settings.";
        setError(message);
        toast.error(message);
      } else {
        const message = "Notification permission not granted.";
        setError(message);
        toast.warning(message);
      }
    } catch (err: any) {
      console.error("Notification permission/subscription error:", err);
      let message = "An error occurred while enabling notifications.";
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          message = "Subscription process was aborted.";
        } else if (err.message.includes("InvalidCharacterError")) {
          message = "VAPID public key is invalid. Check environment variables.";
        } else if (err.message.includes("missing required fields")) {
          message = "Failed to retrieve subscription details.";
        } else {
          message = err.message; // Use the actual error message if available
        }
      }
      setError(message);
      toast.error(message);

      // Attempt to unsubscribe if an error occurred after getting the subscription
      if (currentSubscription) {
        try {
          await currentSubscription.unsubscribe();
          setSubscription(null);
          console.log("Unsubscribed client-side due to error during process.");
        } catch (unsubscribeError) {
          console.error("Error during client-side unsubscribe:", unsubscribeError);
        }
      }
    }
  }, [isSupported, subscribeMutation, subscription]); // Include subscription in deps

  return {
    isSupported,
    permission,
    subscribe,
    isLoading: subscribeMutation.status === "pending",
    error,
    subscription,
    isRegistered: subscribeMutation.status === "success" || !!subscription,
  };
}

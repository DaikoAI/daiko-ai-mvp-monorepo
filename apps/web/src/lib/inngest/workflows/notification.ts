import { inngest } from "@daiko-ai/shared";
import { sendWebPush } from "@/lib/notify";

export const notifyUser = inngest.createFunction(
  { id: "notify-user" },
  { event: "notification/proposal.created" },
  async ({ event, step }) => {
    const { proposals } = event.data;

    for (const proposal of proposals) {
      // Use step.run to wrap the notification sending logic
      // This allows Inngest to manage retries in case of transient errors
      await step.run("send-web-push", async () => {
        if (!proposal.userId) {
          throw new Error("User ID is required for notification");
        }

        await sendWebPush(proposal.userId, {
          title: proposal.title,
          body: proposal.summary,
          // TODO: Add more options like icon, actions etc.
          // See https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
          data: {
            url: `/proposals/${proposal.id}`, // URL to open on click
          },
        });
      });

      console.log(`Notification workflow completed for proposal ${proposal.id}, user ${proposal.userId}`);
    }

    return { success: true };
  },
);

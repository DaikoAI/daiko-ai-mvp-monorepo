import { inngest } from "../client";
import { events } from "../events";
import { sendWebPush } from "@/lib/notify";

export const notifyUser = inngest.createFunction(
  { id: "notify-user" },
  { event: events.proposalCreated },
  async ({ event, step }) => {
    const { proposalId, userId } = event.data;

    // Use step.run to wrap the notification sending logic
    // This allows Inngest to manage retries in case of transient errors
    await step.run("send-web-push", async () => {
      await sendWebPush(userId, {
        title: "New proposal received",
        body: `Proposal ID: ${proposalId} is ready to review.`,
        // TODO: Add more options like icon, actions etc.
        // See https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
        data: {
          url: `/proposals/${proposalId}`, // URL to open on click
        },
      });
    });

    console.log(`Notification workflow completed for proposal ${proposalId}, user ${userId}`);
    return { success: true };
  },
);

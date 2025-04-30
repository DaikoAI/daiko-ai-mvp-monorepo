import { Inngest } from "inngest";
import { env } from "@/env";

/**
 * Shared Inngest client instance with default settings
 */
export const inngest = new Inngest({
  eventKey: env.INNGEST_EVENT_KEY,
  id: "daiko-ai-web",
});

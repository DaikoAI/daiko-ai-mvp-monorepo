import { Inngest } from "inngest";
import { eventSchemas } from "@daiko-ai/shared"; // Import the shared event schemas

/**
 * Shared Inngest client instance with default settings
 */
export const inngest = new Inngest({
  // Remove the <DaikoEvents> type argument
  id: "daiko-ai-web",
  schemas: eventSchemas, // Provide the schemas for type safety
});

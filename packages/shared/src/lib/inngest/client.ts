import { Inngest } from "inngest";
import { eventSchemas } from "./events"; // Changed to relative path

/**
 * Shared Inngest client instance with default settings
 */
export const inngest = new Inngest({
  // Remove the <DaikoEvents> type argument
  id: "daiko-ai",
  schemas: eventSchemas, // Provide the schemas for type safety
});

import { Inngest } from "inngest";
import { eventSchemas } from "./events"; // Changed to relative path

/**
 * Shared Inngest client instance with default settings
 */
export const inngest = new Inngest({
  // Remove the <DaikoEvents> type argument
  id: "daiko-ai",
  baseUrl: process.env.INNGEST_BASE_URL || "http://localhost:3000/api/inngest",
  schemas: eventSchemas, // Provide the schemas for type safety
});

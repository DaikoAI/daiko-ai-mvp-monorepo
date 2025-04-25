import { z } from "zod";

// Adjust import path temporarily - check tsconfig paths later
import { pushSubscriptionTable, usersTable } from "@daiko-ai/shared";
import { UAParser } from "ua-parser-js"; // User agent parser

import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Input schema for the subscribe procedure - ADD userAgent
const subscribeInputSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
  keys: z.object({
    p256dh: z.string().min(1, "p256dh key is required"),
    auth: z.string().min(1, "auth key is required"),
  }),
  userAgent: z.string().optional(), // Add userAgent as optional string
});

export const pushRouter = createTRPCRouter({
  /**
   * Subscribe the current user's browser/device to push notifications.
   * Takes the PushSubscription object details and userAgent from the client.
   */
  subscribe: protectedProcedure.input(subscribeInputSchema).mutation(async ({ ctx, input }) => {
    // Destructure userAgent from input
    const { endpoint, keys, userAgent } = input;
    const userId = ctx.session.user.id;

    // Parse User Agent string received from the client
    const uaString = userAgent; // Use userAgent from input
    let osName = "Unknown";
    let browserName = "Unknown";
    if (uaString) {
      const parser = new UAParser(uaString);
      const result = parser.getResult();
      osName = result.os.name ?? osName;
      browserName = result.browser.name ?? browserName;
    }

    console.log("Received subscription for user:", userId);
    console.log("Endpoint:", endpoint);
    console.log("Keys:", keys);
    console.log("OS:", osName);
    console.log("Browser:", browserName);
    console.log("User Agent:", uaString ?? "Not available");

    // TODO: Implement database logic
    // 1. Check if a subscription with the same endpoint already exists.
    //    - If yes, maybe update its keys and timestamp? Or just return success?
    //    - Consider if a user can subscribe the same endpoint multiple times (should be unique).
    // 2. Check if the user already has a subscription for the same OS/Browser combo (optional, depends on desired UX).
    //    - If yes, maybe update the existing one?
    // 3. Insert the new subscription into the database.

    try {
      // Example: Insert or update logic (using endpoint as unique identifier)
      await ctx.db
        .insert(pushSubscriptionTable)
        .values({
          userId: userId,
          endpoint: endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: uaString, // Use uaString from input
          os: osName,
          browser: browserName,
          // createdAt and updatedAt will default to now()
        })
        .onConflictDoUpdate({
          target: [pushSubscriptionTable.userId, pushSubscriptionTable.endpoint], // Use the composite primary key [userId, endpoint] as the conflict target
          set: {
            // Update fields if the combination of userId and endpoint already exists
            p256dh: keys.p256dh,
            auth: keys.auth,
            userAgent: uaString, // Use uaString from input
            os: osName,
            browser: browserName,
            updatedAt: new Date(), // Explicitly set updated time
          },
        });

      await ctx.db.update(usersTable).set({ notificationEnabled: true }).where(eq(usersTable.id, userId));

      console.log("Subscription saved successfully for user:", userId);
      return { success: true };
    } catch (error) {
      console.error("Failed to save push subscription:", error);
      // Consider throwing a TRPCError for client feedback
      throw new Error("Failed to save subscription."); // Basic error
    }
  }),

  // TODO: Add an `unsubscribe` procedure later
  // unsubscribe: protectedProcedure
  //   .input(z.object({ endpoint: z.string().url() }))
  //   .mutation(async ({ ctx, input }) => {
  //     // Logic to delete the subscription based on endpoint and userId
  //   }),
});

import { and, asc, desc, eq, like } from "drizzle-orm";
import { z } from "zod";

import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { chatMessagesTable, chatThreadsTable } from "@daiko-ai/shared";
import { chatMessageSelectSchema } from "@daiko-ai/shared/src/db";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { OpenAI } from "openai";
export const chatRouter = createTRPCRouter({
  getUserThreads: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).nullish(),
        query: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const userId = ctx.session.user.id;
      const searchQuery = input.query;

      // Build WHERE clause dynamically
      const whereClauses = [eq(chatThreadsTable.userId, userId)];
      if (searchQuery) {
        // Use `ilike` for case-insensitive search (if supported, otherwise use `like` and handle casing)
        // Assuming PostgreSQL which supports `ilike`
        whereClauses.push(like(chatThreadsTable.title, `%${searchQuery}%`));
      }

      // 1. Fetch user's threads with filter
      const threadsData = await ctx.db
        .select({
          id: chatThreadsTable.id,
          title: chatThreadsTable.title,
          createdAt: chatThreadsTable.createdAt,
          updatedAt: chatThreadsTable.updatedAt,
        })
        .from(chatThreadsTable)
        .where(sql.join(whereClauses, sql` AND `)) // Combine where clauses
        .orderBy(desc(chatThreadsTable.updatedAt))
        .limit(limit);

      // 2. Fetch the last message for each thread (potential N+1 issue)
      const threadsWithLastMessage = await Promise.all(
        threadsData.map(async (thread) => {
          const [lastMessage] = await ctx.db
            .select({
              id: chatMessagesTable.id,
              role: chatMessagesTable.role,
              parts: chatMessagesTable.parts,
              attachments: chatMessagesTable.attachments,
              createdAt: chatMessagesTable.createdAt,
            })
            .from(chatMessagesTable)
            .where(eq(chatMessagesTable.threadId, thread.id))
            .orderBy(desc(chatMessagesTable.createdAt))
            .limit(1);
          return {
            ...thread,
            lastMessage: lastMessage || null,
          };
        }),
      );

      return threadsWithLastMessage;
    }),

  getThread: protectedProcedure.input(z.object({ threadId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { threadId } = input;
    const userId = ctx.session.user.id;

    const [thread] = await ctx.db
      .select()
      .from(chatThreadsTable)
      .where(and(eq(chatThreadsTable.id, threadId), eq(chatThreadsTable.userId, userId)))
      .limit(1);

    if (!thread) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Thread not found.",
      });
    }

    return thread;
  }),

  createThread: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [newThread] = await ctx.db
        .insert(chatThreadsTable)
        .values({
          userId: userId,
          title: input.title ?? "New Chat",
        })
        .returning();

      if (!newThread) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create thread.",
        });
      }

      revalidatePath(`/chat`);

      return newThread;
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        limit: z.number().min(1).max(100).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50;
      const { threadId } = input;
      const userId = ctx.session.user.id;

      // Verify user owns the thread using standard select
      const [thread] = await ctx.db
        .select({ id: chatThreadsTable.id })
        .from(chatThreadsTable)
        .where(eq(chatThreadsTable.id, threadId) && eq(chatThreadsTable.userId, userId))
        .limit(1);

      if (!thread) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Thread not found or access denied.",
        });
      }

      // Fetch messages using standard select
      const messages = await ctx.db
        .select()
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.threadId, threadId))
        .orderBy(asc(chatMessagesTable.createdAt)) // Fetch oldest first as per spec example output
        .limit(limit);

      return messages;
    }),

  createMessage: protectedProcedure
    .input(chatMessageSelectSchema.pick({ id: true, threadId: true, role: true, parts: true, attachments: true }))
    .mutation(async ({ ctx, input }) => {
      const { id, threadId, role, parts, attachments } = input;
      const userId = ctx.session.user.id;

      // 1. Verify user owns the thread using standard select
      const [thread] = await ctx.db
        .select({ id: chatThreadsTable.id })
        .from(chatThreadsTable)
        .where(eq(chatThreadsTable.id, threadId) && eq(chatThreadsTable.userId, userId))
        .limit(1);

      if (!thread) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Thread not found or access denied.",
        });
      }

      // Remove transaction block as neon-http driver does not support it
      // Perform operations sequentially

      // 2. Insert the new message
      const [insertedMessage] = await ctx.db // Use ctx.db directly
        .insert(chatMessagesTable)
        .values({
          id,
          threadId,
          role,
          parts,
          attachments,
        })
        .returning();

      if (!insertedMessage) {
        // No need for explicit rollback, just throw error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message.",
        });
      }

      // 3. Update the thread's updated_at timestamp
      await ctx.db // Use ctx.db directly
        .update(chatThreadsTable)
        .set({ updatedAt: new Date() })
        .where(eq(chatThreadsTable.id, threadId));

      revalidatePath(`/chat/${threadId}`);

      return insertedMessage;
    }),

  // New mutation for summarizing thread title
  summarizeAndUpdateThreadTitle: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { threadId } = input;
      const userId = ctx.session.user.id;
      const MESSAGES_FOR_SUMMARY = 6; // Number of messages to use for summary context

      // 1. Verify user owns the thread
      const [thread] = await ctx.db
        .select({ id: chatThreadsTable.id, title: chatThreadsTable.title })
        .from(chatThreadsTable)
        .where(eq(chatThreadsTable.id, threadId) && eq(chatThreadsTable.userId, userId))
        .limit(1);

      if (!thread) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Thread not found or access denied for summarization.",
        });
      }

      // Optional: Avoid summarizing if title seems manually set (or not the default)
      // if (thread.title !== "New Chat") {
      //   console.log(`Thread ${threadId} already has a custom title. Skipping summarization.`);
      //   return { success: true, updated: false, title: thread.title };
      // }

      // 2. Fetch the first few messages for context
      const messages = await ctx.db
        .select({
          role: chatMessagesTable.role,
          parts: chatMessagesTable.parts,
        })
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.threadId, threadId))
        .orderBy(asc(chatMessagesTable.createdAt))
        .limit(MESSAGES_FOR_SUMMARY);

      if (messages.length === 0) {
        console.warn(`No messages found for thread ${threadId}. Cannot summarize.`);
        // Or throw an error if preferred
        return { success: false, updated: false, message: "No messages to summarize." };
      }

      // 3. Construct prompt for LLM
      const conversationHistory = messages
        .map((msg) => {
          const parts = msg.parts as Array<{ type: string; text?: string }>;
          const text = parts[0]?.type === "text" ? parts[0].text : "";
          return `${msg.role}: ${text}`;
        })
        .join("\n\n");

      // Define the prompt string
      const prompt = `Generate a very short, concise title (less than 5 words) for the following conversation. Only output the title itself, with no preamble or explanation.

Conversation:
---
${conversationHistory}
---

Title:`;

      let summarizedTitle = "Summarized Chat"; // Default/fallback title

      try {
        // 4. Call LLM API (Placeholder - replace with your actual LLM call)
        console.log(`Calling LLM to summarize thread: ${threadId}`);

        // TODO: Implement LLM API call here using your chosen provider
        // Ensure you have initialized the client (e.g., openai) and handled API keys securely.

        const openai = new OpenAI({
          apiKey: env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Or another suitable model
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          max_tokens: 20, // Limit title length
          n: 1,
          stop: ["\n"], // Stop generation at newline
        });

        const potentialTitle = response.choices[0]?.message?.content?.trim();
        if (potentialTitle) {
          // Remove surrounding quotes if LLM adds them
          summarizedTitle = potentialTitle.replace(/^[\"']|[\"']$/g, "");
        }

        // Remove the line below if you uncomment and use the actual LLM call
        console.log("LLM call is currently a placeholder.");

        console.log(`LLM proposed title for thread ${threadId}: ${summarizedTitle}`);
      } catch (error) {
        console.error(`LLM summarization failed for thread ${threadId}:`, error);
        // Decide how to handle LLM errors (e.g., log, use fallback, throw)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate title summary.",
          cause: error,
        });
      }

      // 5. Update the thread title in the database
      await ctx.db
        .update(chatThreadsTable)
        .set({
          title: summarizedTitle,
          updatedAt: new Date(), // Also update timestamp
        })
        .where(eq(chatThreadsTable.id, threadId));

      console.log(`Updated title for thread ${threadId} to: ${summarizedTitle}`);

      revalidatePath(`/chat`);
      revalidatePath(`/chat/${threadId}`);

      return { success: true, updated: true, title: summarizedTitle };
    }),
});

export type ChatRouter = typeof chatRouter;

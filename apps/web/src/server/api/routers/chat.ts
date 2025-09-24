import { and, asc, desc, eq, like } from "drizzle-orm";
import { z } from "zod";

import { revalidateChatList, revalidateThread } from "@/app/actions";
import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { ChatMessage } from "@daiko-ai/shared";
import { chatMessageSelectSchema, chatMessagesTable, chatThreadsTable } from "@daiko-ai/shared";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";

function notNull<T>(value: T | null | undefined): value is T {
  return value != null;
}

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
      const threadsData =
        ctx.useMockDb && ctx.mock
          ? await ctx.mock.listThreads(userId)
          : await ctx.db
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
          const [lastMessage] =
            ctx.useMockDb && ctx.mock
              ? (await ctx.mock.listMessages(thread.id, 1)).slice(-1)
              : await ctx.db
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

  getThread: protectedProcedure
    .input(z.object({ threadId: env.USE_MOCK_DB ? z.string() : z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { threadId } = input;
      const userId = ctx.session.user.id;

      const [thread] =
        ctx.useMockDb && ctx.mock
          ? [await ctx.mock.getThread(userId, threadId)].filter(notNull)
          : await ctx.db
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

      const newThread =
        ctx.useMockDb && ctx.mock
          ? await ctx.mock.createThread(userId, input.title ?? "New Chat")
          : (
              await ctx.db
                .insert(chatThreadsTable)
                .values({
                  userId: userId,
                  title: input.title ?? "New Chat",
                })
                .returning()
            )[0];

      if (!newThread) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create thread.",
        });
      }

      revalidateChatList();
      revalidateThread(newThread.id);

      return newThread;
    }),

  updateThread: protectedProcedure
    .input(z.object({ threadId: env.USE_MOCK_DB ? z.string() : z.string().uuid(), title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { threadId, title } = input;
      const userId = ctx.session.user.id;

      const updatedThread =
        ctx.useMockDb && ctx.mock
          ? await ctx.mock.updateThread(userId, threadId, title)
          : (
              await ctx.db
                .update(chatThreadsTable)
                .set({ title })
                .where(and(eq(chatThreadsTable.id, threadId), eq(chatThreadsTable.userId, userId)))
                .returning()
            )[0];

      if (!updatedThread) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update thread.",
        });
      }

      revalidateThread(threadId);

      return updatedThread;
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        threadId: env.USE_MOCK_DB ? z.string() : z.string().uuid(),
        limit: z.number().min(1).max(100).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50;
      const { threadId } = input;
      const userId = ctx.session.user.id;

      // Verify user owns the thread using standard select
      const [thread] =
        ctx.useMockDb && ctx.mock
          ? [await ctx.mock.getThread(userId, threadId)].filter(notNull)
          : await ctx.db
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
      const messages =
        ctx.useMockDb && ctx.mock
          ? await ctx.mock.listMessages(threadId, limit)
          : await ctx.db
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
      const [thread] =
        ctx.useMockDb && ctx.mock
          ? [await ctx.mock.getThread(userId, threadId)].filter(notNull)
          : await ctx.db
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
      const insertedMessage =
        ctx.useMockDb && ctx.mock
          ? await ctx.mock.createMessage({
              id,
              threadId,
              role,
              parts,
              attachments,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as ChatMessage)
          : (
              await ctx.db // Use ctx.db directly
                .insert(chatMessagesTable)
                .values({
                  id,
                  threadId,
                  role,
                  parts,
                  attachments,
                })
                .returning()
            )[0];

      if (!insertedMessage) {
        // No need for explicit rollback, just throw error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message.",
        });
      }

      // 3. Update the thread's updated_at timestamp
      if (!(ctx.useMockDb && ctx.mock)) {
        await ctx.db // Use ctx.db directly
          .update(chatThreadsTable)
          .set({ updatedAt: new Date() })
          .where(eq(chatThreadsTable.id, threadId));
      }

      revalidateThread(threadId);

      return insertedMessage;
    }),
});

export type ChatRouter = typeof chatRouter;

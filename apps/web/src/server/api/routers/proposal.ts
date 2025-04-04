import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { proposalTable } from "@daiko-ai/shared";
import { desc } from "drizzle-orm";
import { z } from "zod";

export const proposalRouter = createTRPCRouter({
  hello: publicProcedure.input(z.object({ text: z.string() })).query(({ input }) => {
    return {
      greeting: `Hello ${input.text}`,
    };
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), summary: z.string().min(1), expires_at: z.date() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(proposalTable).values({
        title: input.title,
        summary: input.summary,
        expires_at: input.expires_at,
        userId: ctx.session.user.id,
        reason: [],
        sources: [],
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const proposal = await ctx.db.query.proposalTable.findFirst({
      orderBy: [desc(proposalTable.createdAt)],
    });

    return proposal ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});

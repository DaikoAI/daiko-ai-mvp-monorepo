import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { proposalTable } from "@daiko-ai/shared";
import { asc, gt } from "drizzle-orm";
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

  getProposals: protectedProcedure.query(async ({ ctx }) => {
    const proposals = await ctx.db.query.proposalTable.findMany({
      orderBy: [asc(proposalTable.expires_at)],
      where: gt(proposalTable.expires_at, new Date()),
    });
    return proposals;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});

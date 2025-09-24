import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import type { ProposalSelect } from "@daiko-ai/shared";
import { proposalTable } from "@daiko-ai/shared";
import { and, asc, eq, gt } from "drizzle-orm";
import { z } from "zod";

export const proposalRouter = createTRPCRouter({
  hello: publicProcedure.input(z.object({ text: z.string() })).query(({ input }) => {
    return {
      greeting: `Hello ${input.text}`,
    };
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), summary: z.string().min(1), expiresAt: z.date() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.useMockDb && ctx.mock) {
        const payload: Omit<ProposalSelect, "id" | "createdAt" | "updatedAt"> = {
          userId: ctx.session.user.id,
          title: input.title,
          summary: input.summary,
          reason: [],
          sources: [],
          type: null,
          proposedBy: "Daiko AI",
          financialImpact: null,
          expiresAt: input.expiresAt,
          status: "active",
          contractCall: null,
          triggerEventId: null,
        };
        await ctx.mock.createProposal(payload);
        return;
      }
      await ctx.db.insert(proposalTable).values({
        title: input.title,
        summary: input.summary,
        expiresAt: input.expiresAt,
        userId: ctx.session.user.id,
        reason: [],
        sources: [],
      });
    }),

  getProposals: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.useMockDb && ctx.mock) {
      const proposals = await ctx.mock.getProposals(ctx.session.user.id, new Date());
      return proposals;
    }
    const proposals = await ctx.db.query.proposalTable.findMany({
      orderBy: [asc(proposalTable.expiresAt)],
      where: and(gt(proposalTable.expiresAt, new Date()), eq(proposalTable.userId, ctx.session.user.id)),
    });
    return proposals;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});

import { chatRouter } from "@/server/api/routers/chat";
import { portfolioRouter } from "@/server/api/routers/portfolio";
import { proposalRouter } from "@/server/api/routers/proposal";
import { pushRouter } from "@/server/api/routers/push";
import { tokensRouter } from "@/server/api/routers/tokens";
import { transactionsRouter } from "@/server/api/routers/transactions";
import { usersRouter } from "@/server/api/routers/users";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  proposal: proposalRouter,
  users: usersRouter,
  portfolio: portfolioRouter,
  tokens: tokensRouter,
  transactions: transactionsRouter,
  chat: chatRouter,
  push: pushRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

import { chatRouter } from "@/server/api/routers/chat";
import { portfolioRouter } from "@/server/api/routers/portfolio";
import { proposalRouter } from "@/server/api/routers/proposal";
import { pushRouter } from "@/server/api/routers/push";
import { transactionsRouter } from "@/server/api/routers/transactions";
import { usersRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { perpRouter } from "./routers/perp";
import { tokenRouter } from "./routers/token";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  proposal: proposalRouter,
  users: usersRouter,
  portfolio: portfolioRouter,
  transactions: transactionsRouter,
  chat: chatRouter,
  push: pushRouter,
  token: tokenRouter,
  perp: perpRouter,
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

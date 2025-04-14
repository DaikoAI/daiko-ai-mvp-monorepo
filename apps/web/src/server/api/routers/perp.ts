import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const perpRouter = createTRPCRouter({
  openPosition: publicProcedure
    .input(
      z.object({
        token: z.string(),
        collateral: z.string(),
        leverage: z.number(),
        direction: z.enum(["long", "short"]),
        walletAddress: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // TODO: 実際のポジションオープンロジックを実装
      console.log("Opening perpetual position:", input);

      // 仮の実装：成功を返す
      return {
        success: true,
        positionId: `pos-${Date.now()}`,
        txHash: `tx-${Date.now()}`,
      };
    }),

  closePosition: publicProcedure
    .input(
      z.object({
        positionId: z.string(),
        walletAddress: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // TODO: 実際のポジションクローズロジックを実装
      console.log("Closing perpetual position:", input);

      // 仮の実装：成功を返す
      return {
        success: true,
        txHash: `tx-${Date.now()}`,
      };
    }),
});

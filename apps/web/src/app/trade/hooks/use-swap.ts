"use client";

import { api } from "@/trpc/react";
import { err, ok } from "neverthrow";
import { useState } from "react";
import { type SwapParams, type SwapResult } from "../types";

export const useSwap = () => {
  const [isLoading, setIsLoading] = useState(false);
  const utils = api.useUtils();
  const transferMutation = api.token.transfer.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries after successful swap
      void utils.token.getTokenPrices.invalidate();
    },
  });

  const swap = async (params: SwapParams): Promise<SwapResult> => {
    try {
      setIsLoading(true);

      // Get wallet address from your auth context or state management
      const walletAddress = "your_wallet_address"; // TODO: Replace with actual wallet address

      // Calculate toAmount based on current prices and slippage
      const fromAmount = params.fromAmount.toString();
      const toAmount = (params.fromAmount * 1.5).toString(); // TODO: Replace with actual price calculation

      const result = await transferMutation.mutateAsync({
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount,
        toAmount,
        walletAddress,
      });

      if (result.success) {
        return ok({
          fromAmount: params.fromAmount,
          toAmount: Number(toAmount),
          txHash: result.txHash,
        });
      }

      return err({
        type: "unknownError",
        message: "Swap failed",
      });
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error types from the token router
        if (error.message.includes("Insufficient balance")) {
          return err({
            type: "insufficientBalance",
            message: error.message,
          });
        }
        if (error.message.includes("Price impact")) {
          return err({
            type: "priceImpactTooHigh",
            message: error.message,
          });
        }
        return err({
          type: "networkError",
          message: error.message,
        });
      }
      return err({
        type: "unknownError",
        message: "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    swap,
    isLoading: isLoading || transferMutation.isPending,
  };
};

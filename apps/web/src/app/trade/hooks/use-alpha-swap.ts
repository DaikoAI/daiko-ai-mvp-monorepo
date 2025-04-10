"use client";

import { useAlphaWallet } from "@/features/alphaWallet/AlphaWalletProvider";
import type { AlphaTx } from "@/features/alphaWallet/types";
import { contractCallToInstruction } from "@/features/alphaWallet/types";
import { err, ok } from "neverthrow";
import { useState } from "react";
import type { SwapParams, SwapResult } from "../types";

export const useAlphaSwap = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { requestTransaction } = useAlphaWallet();

  const swap = async (params: SwapParams): Promise<SwapResult> => {
    try {
      setIsLoading(true);

      const tx: AlphaTx = {
        id: `swap-${Date.now()}`,
        description: `Swap ${params.fromAmount} ${params.fromToken} for ${params.toToken}`,
        requestedBy: "user",
        timestamp: Date.now(),
        instruction: contractCallToInstruction({
          type: "swap",
          description: `Swap ${params.fromAmount} ${params.fromToken} for ${params.toToken}`,
          params: {
            fromToken: params.fromToken,
            toToken: params.toToken,
            fromAmount: params.fromAmount,
          },
        }),
      };

      const result = await requestTransaction(tx);

      if (result.success) {
        return ok({
          fromAmount: params.fromAmount,
          toAmount: Number(tx.instruction.toAmount || "0"),
          txHash: result.txId || "",
        });
      }

      // エラーメッセージに基づいて適切なエラー型を返す
      if (result.error?.includes("insufficient balance")) {
        return err({
          type: "insufficientBalance",
          message: result.error,
        });
      }
      if (result.error?.includes("price impact")) {
        return err({
          type: "priceImpactTooHigh",
          message: result.error,
        });
      }
      if (result.error?.includes("network")) {
        return err({
          type: "networkError",
          message: result.error,
        });
      }

      return err({
        type: "unknownError",
        message: result.error || "Swap failed",
      });
    } catch (error) {
      if (error instanceof Error) {
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
    isLoading,
  };
};

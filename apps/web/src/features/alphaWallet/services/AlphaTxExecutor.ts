import { env } from "@/env";
import { api } from "@/trpc/react";
import { useState } from "react";
import type { AlphaTx, AlphaTxInstruction, AlphaTxResult, TokenRegistry } from "../types";

interface InstructionEffect {
  summary: string;
}

interface ExecuteResult {
  success: boolean;
  error?: string;
  txHash?: string;
}

export function parseInstructionsNetEffects(instruction: AlphaTxInstruction): InstructionEffect {
  return {
    summary: `Send ${instruction.fromAmount} ${instruction.fromToken} and receive ${instruction.toAmount} ${instruction.toToken}`,
  };
}

export function useExecuteInstruction() {
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const transfer = api.token.transfer.useMutation();
  const stake = api.token.stake.useMutation();

  async function execute(instruction: AlphaTxInstruction, walletAddress?: string | null): Promise<ExecuteResult> {
    if (!walletAddress) {
      return {
        success: false,
        error: "Wallet address not found",
      };
    }

    setIsTransferring(true);
    setTransferError(null);

    try {
      // In mock mode, don't call backend; simulate success immediately
      if (env.NEXT_PUBLIC_USE_MOCK_DB) {
        // Validate basic amounts
        const fromAmount = instruction.fromAmount && Number(instruction.fromAmount) > 0 ? instruction.fromAmount : "1";
        const toAmount = instruction.toAmount && Number(instruction.toAmount) > 0 ? instruction.toAmount : fromAmount;
        return {
          success: true,
          txHash: `sim-tx-${Date.now()}`,
        };
      }
      if (instruction.type === "swap") {
        const result = await transfer.mutateAsync({
          fromToken: instruction.fromToken.symbol,
          toToken: instruction.toToken.symbol,
          fromAmount: instruction.fromAmount && Number(instruction.fromAmount) > 0 ? instruction.fromAmount : "1",
          toAmount:
            instruction.toAmount && Number(instruction.toAmount) > 0
              ? instruction.toAmount
              : instruction.fromAmount && Number(instruction.fromAmount) > 0
                ? instruction.fromAmount
                : "1",
          walletAddress,
        });

        return {
          success: result.success,
          txHash: result.txHash,
          error: result.success ? undefined : result.message,
        };
      } else if (instruction.type === "stake") {
        const result = await stake.mutateAsync({
          fromToken: instruction.fromToken.symbol,
          toToken: instruction.toToken.symbol,
          amount: instruction.fromAmount,
          walletAddress,
        });

        return {
          success: true,
          txHash: result.txHash,
        };
      }

      throw new Error("Unsupported instruction type");
    } catch (error) {
      console.error("Transaction execution error:", error);
      setTransferError(error instanceof Error ? error.message : "Unknown error");

      return {
        success: false,
        error: error instanceof Error ? error.message : "Transaction failed",
      };
    } finally {
      setIsTransferring(false);
    }
  }

  return {
    execute,
    isTransferring,
    transferError,
  };
}

export class AlphaTxExecutor {
  private userBalances: Record<string, string> = {};
  private pendingTxs: Set<string> = new Set();

  constructor(
    private readonly tokenRegistry: TokenRegistry,
    initialBalances?: Record<string, string>,
  ) {
    this.userBalances = initialBalances || {};
  }

  /**
   * トランザクションを実行し、ユーザーバランスを更新
   */
  async executeTransaction(tx: AlphaTx): Promise<AlphaTxResult> {
    console.log("executeTransaction", tx);
    try {
      // 重複実行チェック
      if (this.pendingTxs.has(tx.id)) {
        throw new Error("Transaction is already being processed");
      }
      this.pendingTxs.add(tx.id);

      // バランスのバリデーション
      this.validateBalances(tx.instruction);

      // トランザクションの実行とバランスの更新
      const newBalances = this.processInstruction(tx.instruction);
      this.userBalances = newBalances;

      const result: AlphaTxResult = {
        success: true,
        txId: tx.id,
        message: "Transaction executed successfully",
        effects: {
          tokenBalances: this.userBalances,
        },
      };

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        txId: tx.id,
        effects: {
          tokenBalances: this.userBalances,
        },
      };
    } finally {
      this.pendingTxs.delete(tx.id);
    }
  }

  /**
   * 現在のユーザーバランスを取得
   */
  getUserBalances(): Record<string, string> {
    return { ...this.userBalances };
  }

  /**
   * トランザクション実行前のバランスバリデーション
   */
  private validateBalances(instruction: AlphaTxInstruction): void {
    const currentBalance = BigInt(this.userBalances[instruction.fromToken.symbol] || "0");
    const requiredAmount = BigInt(instruction.fromAmount || "0");

    // Token existence check
    if (!this.tokenRegistry.getToken(instruction.fromToken.symbol)) {
      throw new Error(`Token not found in registry: ${instruction.fromToken.symbol}`);
    }
    if (!this.tokenRegistry.getToken(instruction.toToken.symbol)) {
      throw new Error(`Token not found in registry: ${instruction.toToken.symbol}`);
    }

    // 残高不足チェック
    if (currentBalance < requiredAmount) {
      throw new Error(
        `Insufficient balance for ${instruction.fromToken.symbol}. Required: ${requiredAmount}, Available: ${currentBalance}`,
      );
    }
  }

  /**
   * 命令を処理してバランスを更新
   */
  private processInstruction(instruction: AlphaTxInstruction): Record<string, string> {
    let newBalances = { ...this.userBalances };

    const fromAmount = BigInt(instruction.fromAmount || "0");
    const toAmount = BigInt(instruction.toAmount || "0");

    // Use symbol for indexing
    const currentFromBalance = BigInt(newBalances[instruction.fromToken.symbol] || "0");
    newBalances[instruction.fromToken.symbol] = (currentFromBalance - fromAmount).toString();

    const currentToBalance = BigInt(newBalances[instruction.toToken.symbol] || "0");
    newBalances[instruction.toToken.symbol] = (currentToBalance + toAmount).toString();

    return newBalances;
  }
}

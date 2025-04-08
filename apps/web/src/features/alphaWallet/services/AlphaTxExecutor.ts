import { api } from "@/trpc/react";
import type { AlphaTx, AlphaTxInstruction, AlphaTxResult, TokenRegistry } from "../types";

interface InstructionEffect {
  summary: string;
}

export function parseInstructionsNetEffects(instructions: AlphaTxInstruction[]): InstructionEffect[] {
  return instructions.map((inst) => ({
    summary: `Send ${inst.fromAmount} ${inst.fromToken} and receive ${inst.toAmount} ${inst.toToken}`,
  }));
}

export function useExecuteInstruction() {
  const transferMutation = api.token.transfer.useMutation();

  async function execute(instruction: AlphaTxInstruction, walletAddress?: string) {
    if (!walletAddress) throw new Error("No wallet address provided");

    return await transferMutation.mutateAsync({
      fromToken: instruction.fromToken.symbol,
      toToken: instruction.toToken.symbol,
      fromAmount: instruction.fromAmount || "0",
      toAmount: instruction.toAmount || "0",
      walletAddress,
    });
  }

  return {
    execute,
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

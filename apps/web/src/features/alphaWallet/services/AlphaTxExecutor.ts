import { api } from "@/trpc/react";
import type { AlphaTxInstruction } from "../types";

interface InstructionEffect {
  summary: string;
}

export function parseInstructionsNetEffects(instructions: AlphaTxInstruction[]): InstructionEffect[] {
  return instructions.map((inst) => {
    switch (inst.type) {
      case "transfer":
        return {
          summary: `Send ${inst.fromAmount} ${inst.fromToken} and receive ${inst.toAmount} ${inst.toToken}`,
        };
      case "stake":
        return {
          summary: `Stake ${inst.amount} ${inst.token} (APY: ${inst.apy}%)`,
        };
      case "perp_open":
        return {
          summary: `${inst.token} - ${inst.leverage}x leverage, ${inst.direction === "long" ? "long" : "short"}, collateral ${inst.collateral}`,
        };
      case "perp_close":
        return {
          summary: `Close position ID ${inst.positionId}`,
        };
      default:
        return {
          summary: `Unknown instruction: ${JSON.stringify(inst)}`,
        };
    }
  });
}

export function useExecuteInstruction() {
  const transferMutation = api.token.transfer.useMutation();
  const stakeMutation = api.token.stake.useMutation();
  const openPositionMutation = api.perp.openPosition.useMutation();
  const closePositionMutation = api.perp.closePosition.useMutation();

  return async function execute(instruction: AlphaTxInstruction, walletAddress?: string) {
    if (!walletAddress) throw new Error("No wallet address provided");

    switch (instruction.type) {
      case "transfer":
        return await transferMutation.mutateAsync({
          fromToken: instruction.fromToken,
          toToken: instruction.toToken,
          fromAmount: instruction.fromAmount,
          toAmount: instruction.toAmount,
          walletAddress,
        });

      case "stake":
        return await stakeMutation.mutateAsync({
          token: instruction.token,
          amount: instruction.amount,
          walletAddress,
        });

      case "perp_open":
        return await openPositionMutation.mutateAsync({
          token: instruction.token,
          collateral: instruction.collateral,
          leverage: instruction.leverage,
          direction: instruction.direction,
          walletAddress,
        });

      case "perp_close":
        return await closePositionMutation.mutateAsync({
          positionId: instruction.positionId,
          walletAddress,
        });

      default:
        throw new Error(`Unknown instruction type: ${(instruction as any).type}`);
    }
  };
}

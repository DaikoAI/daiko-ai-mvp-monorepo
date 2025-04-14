import { type TokenSelect as Token } from "@daiko-ai/shared";
import type { Result } from "neverthrow";
export interface TokenBalance {
  symbol: string;
  amount: number;
}

export interface SwapParams {
  type: "swap" | "stake";
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  toAmount?: number;
}

export type SwapError =
  | { type: "insufficientBalance"; message: string }
  | { type: "priceImpactTooHigh"; message: string }
  | { type: "networkError"; message: string }
  | { type: "unknownError"; message: string };

export type SwapResult = Result<{ fromAmount: number; toAmount: number; txHash: string }, SwapError>;

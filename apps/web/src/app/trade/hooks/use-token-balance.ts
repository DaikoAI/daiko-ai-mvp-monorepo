"use client";

import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";

interface UseTokenBalanceResult {
  balance: number | null;
  isLoading: boolean;
  error: Error | null;
}

export const useTokenBalance = (symbol: string): UseTokenBalanceResult => {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress;

  const { data: token } = api.token.getTokenBySymbol.useQuery(
    { symbol },
    {
      enabled: !!walletAddress,
    },
  );

  const { data: balances, isLoading } = api.portfolio.getUserPortfolio.useQuery(
    {
      walletAddress: walletAddress || "",
      forceRefresh: true,
    },
    {
      enabled: !!walletAddress && !!token,
    },
  );

  if (!walletAddress) {
    return {
      balance: null,
      isLoading: false,
      error: new Error("Wallet not connected"),
    };
  }

  if (isLoading) {
    return {
      balance: null,
      isLoading: true,
      error: null,
    };
  }

  if (!balances || !balances.tokens) {
    return {
      balance: 0,
      isLoading: false,
      error: null,
    };
  }

  return {
    balance: Number(balances.tokens.find((t) => t.token_address === token?.address)?.balance || 0),
    isLoading: false,
    error: null,
  };
};

"use client";

import { api } from "@/trpc/react";

interface UseTokenPriceResult {
  price: number | null;
  isLoading: boolean;
  error: Error | null;
}

export const useTokenPrice = (symbol: string): UseTokenPriceResult => {
  const { data: token } = api.token.getTokenBySymbol.useQuery({ symbol });
  const { data: prices, isLoading } = api.token.getTokenPrices.useQuery(
    {
      tokenAddresses: token ? [token.address] : [],
      limit: 1,
    },
    {
      enabled: !!token,
    },
  );

  if (isLoading) {
    return {
      price: null,
      isLoading: true,
      error: null,
    };
  }

  if (!prices || prices.length === 0) {
    return {
      price: null,
      isLoading: false,
      error: new Error("Price not found"),
    };
  }

  return {
    price: Number(prices[0]?.priceUsd || 0),
    isLoading: false,
    error: null,
  };
};

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type TokenSelect as Token } from "@daiko-ai/shared";
import { ArrowDownIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAlphaSwap } from "../hooks/use-alpha-swap";
import { useTokenPrice } from "../hooks/use-token-price";
import { canSwap, isInsufficientBalance, validateSwap } from "../utils/swap-validation";
import { getAvailableTokens } from "../utils/token-filter";
import { TokenSelect } from "./token-select";

interface Balance {
  priceChange24h: string;
  symbol: string;
  tokenAddress: string;
  balance: string;
  priceUsd: string;
  valueUsd: string;
  iconUrl: string;
}

export const SwapForm: React.FC<{ tokens: Token[]; balances: Balance[] }> = ({ tokens, balances }) => {
  const [fromAmount, setFromAmount] = useState<string>("");
  const [fromToken, setFromToken] = useState<Token>(tokens[0]!);
  const [toToken, setToToken] = useState<Token>(tokens[1]!);

  const { price: fromPrice, isLoading: isFromPriceLoading } = useTokenPrice(fromToken?.symbol || "");
  const { price: toPrice, isLoading: isPriceLoading } = useTokenPrice(toToken?.symbol || "");

  const { swap, isLoading: isSwapping } = useAlphaSwap();

  const getBalance = (token: Token) => {
    const balance = balances.find((b) => b.symbol === token.symbol);
    return balance ? Number(balance.balance) : 0;
  };

  const fromBalance = getBalance(fromToken);

  // 利用可能なトークンのリストを取得
  const availableFromTokens = getAvailableTokens(tokens, toToken, true);
  const availableToTokens = getAvailableTokens(tokens, fromToken, false);

  const handleFromTokenChange = (token: Token) => {
    setFromToken(token);
    // 新しい組み合わせが無効な場合、ToTokenをリセット
    if (!getAvailableTokens(tokens, token, false).includes(toToken)) {
      setToToken(availableToTokens[0]!);
    }
  };

  const handleToTokenChange = (token: Token) => {
    setToToken(token);
    // 新しい組み合わせが無効な場合、FromTokenをリセット
    if (!getAvailableTokens(tokens, token, true).includes(fromToken)) {
      setFromToken(availableFromTokens[0]!);
    }
  };

  const handleSwap = async () => {
    if (!fromPrice || !toPrice) return;

    const validationResult = validateSwap(fromToken, toToken, fromAmount, fromBalance);
    if (!validationResult.isValid) {
      toast.error(validationResult.error?.message);
      return;
    }

    const result = await swap({
      type: toToken.type === "liquid_staking" ? "stake" : "swap",
      fromToken: fromToken,
      toToken: toToken,
      fromAmount: Number(fromAmount),
    });

    result.match(
      (success) => {
        toast.success("Swap executed successfully", {
          description: `Swapped ${success.fromAmount} ${fromToken.symbol} for ${success.toAmount} ${toToken.symbol}`,
        });
        setFromAmount("");
      },
      (error) => {
        toast.error("Swap failed", {
          description: error.message,
        });
      },
    );
  };

  const estimatedAmount =
    fromPrice && toPrice && fromAmount
      ? toToken.type === "liquid_staking"
        ? fromAmount // 1:1 ratio for staking tokens
        : ((Number(fromAmount) * fromPrice) / toPrice).toFixed(6)
      : "0";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            className={`flex-1 ${isInsufficientBalance(fromAmount, fromBalance) ? "border-red-500" : ""}`}
          />
          <TokenSelect tokens={availableFromTokens} value={fromToken} onChange={handleFromTokenChange} />
        </div>
        <div className="flex justify-between text-sm">
          {isFromPriceLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <>
              <p className="text-muted-foreground">≈ ${(Number(fromAmount) * (fromPrice || 0)).toFixed(2)}</p>
              <p className="text-muted-foreground">
                Balance: {fromBalance.toFixed(4)} {fromToken?.symbol}
              </p>
            </>
          )}
        </div>
        {isInsufficientBalance(fromAmount, fromBalance) && <p className="text-sm text-red-500">Insufficient balance</p>}
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // トークンの入れ替えが有効な場合のみ実行
            if (getAvailableTokens(tokens, toToken, true).includes(fromToken)) {
              setFromToken(toToken);
              setToToken(fromToken);
            }
          }}
        >
          <ArrowDownIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Input type="number" value={estimatedAmount} readOnly placeholder="0.0" className="flex-1" />
          <TokenSelect tokens={availableToTokens} value={toToken} onChange={handleToTokenChange} />
        </div>
        {isPriceLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <p className="text-sm text-muted-foreground">
            ≈ $
            {(Number(estimatedAmount) * (toToken.type === "liquid_staking" ? fromPrice || 0 : toPrice || 0)).toFixed(2)}
          </p>
        )}
      </div>

      <Button
        className="w-full text-lg font-bold"
        onClick={handleSwap}
        disabled={!canSwap(fromToken, toToken, fromAmount, fromBalance, isSwapping)}
      >
        {isSwapping ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Swapping...
          </>
        ) : (
          "Swap"
        )}
      </Button>
    </div>
  );
};

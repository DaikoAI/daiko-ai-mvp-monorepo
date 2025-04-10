"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type TokenSelect as Token } from "@daiko-ai/shared";
import { ArrowDownIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSwap } from "../hooks/use-swap";
import { useTokenBalance } from "../hooks/use-token-balance";
import { useTokenPrice } from "../hooks/use-token-price";
import { TokenSelect } from "./token-select";

export const SwapForm: React.FC<{ tokens: Token[] }> = ({ tokens }) => {
  const [fromAmount, setFromAmount] = useState<string>("");
  const [fromToken, setFromToken] = useState<string>("SOL");
  const [toToken, setToToken] = useState<string>("USDC");
  const [slippageTolerance] = useState(0.5); // 0.5%

  const { price: fromPrice, isLoading: isFromPriceLoading } = useTokenPrice(fromToken);
  const { price: toPrice, isLoading: isPriceLoading } = useTokenPrice(toToken);
  const { balance: fromBalance, isLoading: isBalanceLoading } = useTokenBalance(fromToken);
  const { swap, isLoading: isSwapping } = useSwap();

  const handleSwap = async () => {
    if (!fromPrice || !toPrice || !fromBalance) return;

    const numericAmount = Number(fromAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (numericAmount > fromBalance) {
      toast.error(`You don't have enough ${fromToken}`);
      return;
    }

    const result = await swap({
      fromToken,
      toToken,
      fromAmount: numericAmount,
      slippageTolerance,
    });

    result.match(
      (success: any) => {
        toast.success(`Swapped ${success.fromAmount} ${fromToken} for ${success.toAmount} ${toToken}`);
        setFromAmount("");
      },
      (error: any) => {
        toast.error(error.message);
      },
    );
  };

  const estimatedAmount =
    fromPrice && toPrice && fromAmount ? ((Number(fromAmount) * fromPrice) / toPrice).toFixed(6) : "0";

  const isInsufficientBalance = fromBalance !== null && Number(fromAmount) > fromBalance;
  const isValidAmount = Number(fromAmount) > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            className={`flex-1 ${isInsufficientBalance ? "border-red-500" : ""}`}
          />
          <TokenSelect tokens={tokens} value={fromToken} onChange={(value) => setFromToken(value)} />
        </div>
        <div className="flex justify-between text-sm">
          {isFromPriceLoading || isBalanceLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <>
              <p className="text-muted-foreground">≈ ${(Number(fromAmount) * (fromPrice || 0)).toFixed(2)}</p>
              <p className="text-muted-foreground">
                Balance: {fromBalance?.toFixed(4) || "0"} {fromToken}
              </p>
            </>
          )}
        </div>
        {isInsufficientBalance && <p className="text-sm text-red-500">Insufficient balance</p>}
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setFromToken(toToken);
            setToToken(fromToken);
          }}
        >
          <ArrowDownIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Input type="number" value={estimatedAmount} readOnly placeholder="0.0" className="flex-1" />
          <TokenSelect tokens={tokens} value={toToken} onChange={(value) => setToToken(value)} />
        </div>
        {isPriceLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <p className="text-sm text-muted-foreground">≈ ${(Number(estimatedAmount) * (toPrice || 0)).toFixed(2)}</p>
        )}
      </div>

      <Button
        className="w-full text-lg font-bold"
        onClick={handleSwap}
        disabled={!isValidAmount || isInsufficientBalance || isSwapping || fromToken === toToken}
      >
        {isSwapping ? "Swapping..." : "Swap"}
      </Button>
    </div>
  );
};

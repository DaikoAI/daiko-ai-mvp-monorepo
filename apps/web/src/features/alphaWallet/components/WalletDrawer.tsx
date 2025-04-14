"use client";

import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { tokenImageMap } from "@/constants/tokens";
import { getTokenPrices } from "@/lib/token-price";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { AlphaTx, AlphaTxInstruction } from "../types";

interface WalletDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  tx: AlphaTx | null;
  onConfirm: () => Promise<void>;
  onReject: () => void;
  error?: string | null;
}

interface TokenPrice {
  usdPrice: number;
}

const TokenIcon: React.FC<{ symbol: string; size?: number }> = ({ symbol, size = 24 }) => {
  return (
    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-gray-700 shadow-lg">
      <Image
        src={tokenImageMap[symbol] || "/tokens/default.svg"}
        alt={symbol}
        width={size}
        height={size}
        className="object-cover rounded-full h-full w-full"
      />
    </div>
  );
};

const TokenDisplay: React.FC<{
  symbol: string;
  amount?: string;
  type: "from" | "to";
  usdPrice?: string;
  isLoading?: boolean;
}> = ({ symbol, amount, type, usdPrice, isLoading = false }) => (
  <div className="flex items-center bg-gray-800/30 rounded-xl p-4 border border-gray-800">
    <div className="flex items-center gap-3 flex-1">
      <TokenIcon symbol={symbol} />
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-300">{symbol}</p>
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : usdPrice ? (
          <p className="text-xs text-gray-500">${Number(usdPrice).toFixed(2)}</p>
        ) : null}
      </div>
    </div>
    <p className="text-xl font-bold tracking-tight" style={{ color: type === "from" ? "#f87171" : "#4ade80" }}>
      {type === "from" ? "-" : "+"}
      {amount}
    </p>
  </div>
);

const TransactionDisplay: React.FC<{
  instruction: AlphaTxInstruction;
  tokenPrices: Record<string, string>;
  isLoading: boolean;
}> = ({ instruction, tokenPrices, isLoading }) => {
  return (
    <div className="grid grid-cols-1 gap-3">
      <TokenDisplay
        symbol={instruction.fromToken.symbol}
        amount={instruction.fromAmount}
        type="from"
        usdPrice={tokenPrices[instruction.fromToken.address]}
        isLoading={isLoading}
      />
      <div className="flex justify-center">
        <div className="bg-gray-800/50 rounded-full p-1.5">
          <ArrowRight className="w-4 h-4 text-gray-500 rotate-90" />
        </div>
      </div>
      <TokenDisplay
        symbol={instruction.toToken.symbol}
        amount={instruction.toAmount}
        type="to"
        usdPrice={tokenPrices[instruction.toToken.address]}
        isLoading={isLoading}
      />
    </div>
  );
};

export const WalletDrawer: React.FC<WalletDrawerProps> = ({
  isOpen,
  tx,
  onConfirm,
  onReject,
  setIsOpen,
  error: externalError,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<Record<string, string>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsConfirming(false);
      setIsConfirmed(false);
      setTokenPrices({});
      setIsLoadingPrices(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsConfirming(false);
    setIsConfirmed(false);
  }, [tx?.id]);

  useEffect(() => {
    if (externalError) {
      setIsConfirming(false);
      setIsConfirmed(false);
    }
  }, [externalError]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (!tx || !tx.instruction) return;

      const instruction = tx.instruction;
      console.log("instruction", instruction);

      // ステーキング取引の場合は1:1のレートを設定
      if (instruction.type === "stake" || instruction.metadata?.tokenType === "staking") {
        instruction.toAmount = instruction.fromAmount;
        // 1:1のレートを設定
        setTokenPrices({
          [instruction.fromToken.address]: "1",
          [instruction.toToken.address]: "1",
        });
        return;
      }

      setIsLoadingPrices(true);
      try {
        const tokenAddresses = [instruction.fromToken.address, instruction.toToken.address];
        const prices = await getTokenPrices(tokenAddresses);
        console.log("prices", prices);
        setTokenPrices(prices);

        const fromPrice = parseFloat(prices[instruction.fromToken.address] || "0");
        const toPrice = parseFloat(prices[instruction.toToken.address] || "0");
        const fromAmount = parseFloat(instruction.fromAmount || "0");

        const equivalentToAmount = (fromAmount * fromPrice) / toPrice;
        instruction.toAmount = equivalentToAmount.toFixed(6);
      } catch (error) {
        console.error("Failed to fetch token prices:", error);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [tx]);

  const handleConfirm = async () => {
    if (isConfirming) return;

    try {
      setIsConfirming(true);
      await onConfirm();
      if (!externalError) {
        setIsConfirmed(true);
      }
    } catch (err) {
      console.error("Error confirming transaction:", err);
      setIsConfirming(false);
    }
  };

  const handleReject = () => {
    if (!isConfirming) {
      onReject();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleReject}>
      <DrawerContent className="bg-background text-foreground border-t border-gray-800 rounded-t-xl">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-800 flex-shrink-0">
                <Image src="/icon.jpg" alt="Site Icon" width={48} height={48} className="object-cover" />
              </div>
              <div className="text-left">
                <DialogTitle>Confirm transaction</DialogTitle>
                <p className="text-sm text-gray-400">daiko.ai</p>
              </div>
            </div>

            <DrawerDescription className="text-gray-400 mx-auto">
              Balance changes are estimated. <br />
              Amounts and assets involved are not guaranteed.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {externalError ? (
              <div className="bg-red-900/20 border border-red-900 rounded-lg p-4 text-red-400">
                <p className="text-sm font-medium">Transaction failed</p>
                <p className="text-xs mt-1">{externalError}</p>
              </div>
            ) : isConfirmed ? (
              <div className="flex flex-col items-center gap-2">
                <Check className="text-green-500 w-8 h-8" />
                <p className="text-sm text-gray-400">Transaction completed</p>
              </div>
            ) : (
              tx?.instruction && (
                <TransactionDisplay
                  instruction={tx.instruction}
                  tokenPrices={tokenPrices}
                  isLoading={isLoadingPrices}
                />
              )
            )}
          </div>

          <div className="p-6 border-t border-gray-800">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isConfirming}
                className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800 font-bold text-md"
              >
                {externalError ? "Close" : "Cancel"}
              </Button>
              {!externalError && !isConfirmed && (
                <Button
                  variant="default"
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="flex-1 bg-[#FF9100] hover:bg-orange-500 text-white font-bold text-md"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

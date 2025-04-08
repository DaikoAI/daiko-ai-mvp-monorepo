"use client";

import { useSession } from "next-auth/react";
import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { WalletDrawer } from "./components/WalletDrawer";
import { useExecuteInstruction } from "./services/AlphaTxExecutor";
import type { AlphaTx, AlphaTxResult, AlphaWalletInterface } from "./types";

const AlphaWalletContext = createContext<AlphaWalletInterface | null>(null);

export function AlphaWalletProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingTx, setPendingTx] = useState<AlphaTx | null>(null);
  const [pendingTxResolver, setPendingTxResolver] = useState<((res: AlphaTxResult) => void) | null>(null);
  const { execute } = useExecuteInstruction();

  async function requestTransaction(tx: AlphaTx): Promise<AlphaTxResult> {
    return new Promise<AlphaTxResult>((resolve) => {
      setPendingTx(tx);
      setPendingTxResolver(() => resolve);
      setIsDrawerOpen(true);
    });
  }

  async function handleConfirmTx() {
    console.log("handleConfirmTx", pendingTx);
    if (!pendingTx || !pendingTxResolver) {
      console.error("Pending transaction or resolver not found");
      return;
    }

    try {
      await execute(pendingTx.instruction, session?.user?.walletAddress);

      pendingTxResolver({
        success: true,
        message: "Transaction executed successfully",
        txId: `tx-${Date.now()}`,
      });

      toast.success("Transaction executed", {
        description: "Your transaction has been processed successfully.",
      });
    } catch (err: any) {
      pendingTxResolver({
        success: false,
        error: err?.message || "Transaction execution failed",
      });

      toast.error("Transaction failed", {
        description: err?.message || "An error occurred while processing your transaction.",
      });
    }

    setPendingTx(null);
    setPendingTxResolver(null);
    setIsDrawerOpen(false);
  }

  function handleRejectTx() {
    if (pendingTxResolver) {
      pendingTxResolver({
        success: false,
        error: "Transaction rejected by user",
      });

      toast.error("Transaction rejected", {
        description: "You have rejected the transaction.",
      });
    }
    setPendingTx(null);
    setPendingTxResolver(null);
    setIsDrawerOpen(false);
  }

  const value: AlphaWalletInterface = {
    requestTransaction,
    walletAddress: session?.user?.walletAddress,
    isDrawerOpen,
  };

  return (
    <AlphaWalletContext.Provider value={value}>
      {children}
      <WalletDrawer isOpen={isDrawerOpen} tx={pendingTx} onConfirm={handleConfirmTx} onReject={handleRejectTx} />
    </AlphaWalletContext.Provider>
  );
}

export function useAlphaWallet() {
  const ctx = useContext(AlphaWalletContext);
  if (!ctx) throw new Error("useAlphaWallet must be used within an AlphaWalletProvider");
  return ctx;
}

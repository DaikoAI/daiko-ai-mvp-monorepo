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
  const [txError, setTxError] = useState<string | null>(null);

  async function requestTransaction(tx: AlphaTx): Promise<AlphaTxResult> {
    return new Promise<AlphaTxResult>((resolve) => {
      setPendingTx(tx);
      setPendingTxResolver(() => resolve);
      setIsDrawerOpen(true);
      setTxError(null); // Reset error state on new transaction
    });
  }

  async function handleConfirmTx() {
    console.log("handleConfirmTx", pendingTx);
    if (!pendingTx || !pendingTxResolver) {
      console.error("Pending transaction or resolver not found");
      return;
    }

    try {
      setTxError(null);
      const result = await execute(pendingTx.instruction, session?.user?.walletAddress);

      if (!result.success) {
        throw new Error(result.error || "Transaction failed");
      }

      pendingTxResolver({
        success: true,
        message: "Transaction executed successfully",
        txId: `tx-${Date.now()}`,
      });

      toast.success("Transaction executed", {
        description: "Your transaction has been processed successfully.",
      });

      // Close drawer after success
      setTimeout(() => {
        setIsDrawerOpen(false);
        setPendingTx(null);
        setPendingTxResolver(null);
      }, 1500);
    } catch (err: any) {
      console.error("Transaction error:", err);
      const errorMessage = err?.message || "Transaction execution failed";
      setTxError(errorMessage);

      pendingTxResolver({
        success: false,
        error: errorMessage,
      });

      toast.error("Transaction failed", {
        description: errorMessage,
      });
    }
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
    setTxError(null);
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
      <WalletDrawer
        isOpen={isDrawerOpen}
        tx={pendingTx}
        setIsOpen={setIsDrawerOpen}
        onConfirm={handleConfirmTx}
        onReject={handleRejectTx}
        error={txError}
      />
    </AlphaWalletContext.Provider>
  );
}

export function useAlphaWallet() {
  const ctx = useContext(AlphaWalletContext);
  if (!ctx) throw new Error("useAlphaWallet must be used within an AlphaWalletProvider");
  return ctx;
}

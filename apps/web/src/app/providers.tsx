"use client";

import { PwaFooter } from "@/components/pwa-footer";
import { TRPCReactProvider } from "@/trpc/react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = clusterApiUrl(network);

  const wallets = [new PhantomWalletAdapter(), new UnsafeBurnerWalletAdapter()];

  return (
    <AnimatePresence mode="wait">
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <TRPCReactProvider>
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="h-full"
                >
                  {children}
                </motion.div>
                <PwaFooter />
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </TRPCReactProvider>
      </ThemeProvider>
    </AnimatePresence>
  );
};

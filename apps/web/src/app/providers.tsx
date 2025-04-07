"use client";

// import { unstable_ViewTransition as ViewTransition } from "react";
import { PwaFooter } from "@/components/pwa-footer";
import { TRPCReactProvider } from "@/trpc/react";
// import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
// import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { PhantomWalletAdapter, UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
// import { clusterApiUrl } from "@solana/web3.js";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  // const network = WalletAdapterNetwork.Devnet;

  // // You can also provide a custom RPC endpoint.
  // const endpoint = clusterApiUrl(network);

  // const wallets = [new PhantomWalletAdapter(), new UnsafeBurnerWalletAdapter()];

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <SessionProvider>
        <TRPCReactProvider>
          {/* <ConnectionProvider endpoint={endpoint}>
              <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider> */}

          {children}
          <PwaFooter />

          {/* </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider> */}
        </TRPCReactProvider>
      </SessionProvider>
    </ThemeProvider>
  );
};

"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/app/onboarding/onboarding-context";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect } from "react";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey) {
      setCurrentStep("notification");
    }
  }, [publicKey]);

  // Skip handler for already connected wallets
  const handleSkip = () => {
    setCurrentStep("notification");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Connect Wallet</CardTitle>
        <CardDescription>Enable access to crypto assets and secure transactions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-primary"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M21 8H8" />
              <path d="M21 12H8" />
              <path d="M21 16H8" />
              <path d="M4 8h.01" />
              <path d="M4 12h.01" />
              <path d="M4 16h.01" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-medium">Benefits of Wallet Connection</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Secure management and trading of crypto assets</li>
            <li>• Seamless investment experience</li>
            <li>• Transaction history tracking</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <WalletMultiButton />
      </CardFooter>
    </Card>
  );
};

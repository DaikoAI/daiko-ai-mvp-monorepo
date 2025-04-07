import { ActionButtons } from "../components/action-buttons";
import { CollectiblesTab } from "../components/collectibles-tab";
import { Tabs } from "../components/tabs";
import { TokensTab } from "../components/tokens-tab";

import type { NextPage } from "next";

import { AuthAvatar } from "@/components/auth-avater";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Suspense } from "react";
import { BalanceCard } from "../components/balance-card";

export const experimental_ppr = true;

type PortfolioPageProps = {
  params: Promise<{
    publicKey: string;
  }>;
};

const PortfolioPage: NextPage<PortfolioPageProps> = async ({ params }) => {
  // Get the wallet address from params
  const { publicKey } = await params;
  const walletAddress = publicKey;

  // NFTsは現在APIから返されていない場合は空配列を使用
  const nfts: any[] = [];

  return (
    <main className="safe-main-container px-4 pt-6 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href="/profile" className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
            <Suspense fallback={<Skeleton className="w-full h-full rounded-full" />}>
              <AuthAvatar />
            </Suspense>
          </div>
        </Link>
        <ActionButtons />
      </header>

      <Suspense fallback={<BalanceCard.Skeleton />}>
        <BalanceCard walletAddress={walletAddress} />
      </Suspense>

      {/* Use Tabs component with Composition Pattern */}
      <Tabs
        tokensTab={
          <Suspense fallback={<TokensTab.Skeleton />}>
            <TokensTab walletAddress={walletAddress} />
          </Suspense>
        }
        collectiblesTab={<CollectiblesTab nfts={nfts} />}
      />
    </main>
  );
};

export default PortfolioPage;

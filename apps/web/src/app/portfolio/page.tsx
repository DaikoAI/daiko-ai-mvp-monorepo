import { ActionButtons } from "./components/action-buttons";
import { CollectiblesTab } from "./components/collectibles-tab";
import { Tabs } from "./components/tabs";
import { TokensTab } from "./components/tokens-tab";

import type { NextPage } from "next";

import { AuthAvatar } from "@/components/auth-avater";
import { HapticLink } from "@/components/haptic-link";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { BalanceCard } from "./components/balance-card";

const PortfolioPage: NextPage = async () => {
  return (
    <main className="safe-main-container px-4 pt-6 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <HapticLink href="/profile" className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
            <Suspense fallback={<Skeleton className="w-full h-full rounded-full" />}>
              <AuthAvatar />
            </Suspense>
          </div>
        </HapticLink>
        <ActionButtons />
      </header>

      <Suspense fallback={<BalanceCard.Skeleton />}>
        <BalanceCard />
      </Suspense>

      {/* Use Tabs component with Composition Pattern */}
      <Tabs
        tokensTab={
          <Suspense fallback={<TokensTab.Skeleton />}>
            <TokensTab />
          </Suspense>
        }
        collectiblesTab={<CollectiblesTab />}
      />
    </main>
  );
};

export default PortfolioPage;

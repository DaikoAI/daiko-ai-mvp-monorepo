import { AuthAvatar } from "@/components/auth-avater";
import { HapticLink } from "@/components/haptic-link";
import { Skeleton } from "@/components/ui/skeleton";
import { type NextPage } from "next";
import { Suspense } from "react";
import { ActionButtons } from "../portfolio/components/action-buttons";
import { SwapCard } from "./components/swap-card";

const TradePage: NextPage = () => {
  return (
    <main className="safe-main-container mx-auto px-4 pt-6">
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
      <div className="flex flex-col items-center justify-center py-4">
        <Suspense fallback={<SwapCard.Skeleton />}>
          <SwapCard />
        </Suspense>
      </div>
    </main>
  );
};

export default TradePage;

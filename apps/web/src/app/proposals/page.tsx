import type { NextPage } from "next";
import { ActionButtons } from "../portfolio/components/action-buttons";
import Link from "next/link";
import { Suspense } from "react";
import { AuthAvatar } from "@/components/auth-avater";
import { Skeleton } from "@/components/ui/skeleton";
import { ProposalListSection } from "./components/proposal-list-section";

const ProposalsPage: NextPage = async () => {
  return (
    <main className="safe-main-container bg-[#080808] text-white px-3 pt-6">
      <header className="flex items-center justify-between mb-6 px-1">
        <Link href="/profile" className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
            <Suspense fallback={<Skeleton className="w-full h-full rounded-full" />}>
              <AuthAvatar />
            </Suspense>
          </div>
        </Link>
        <ActionButtons />
      </header>

      <ProposalListSection />
    </main>
  );
};

export default ProposalsPage;

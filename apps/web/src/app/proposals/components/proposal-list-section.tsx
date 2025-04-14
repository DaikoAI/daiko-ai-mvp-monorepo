import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProposalList } from "./proposal-list";

export const ProposalListSection: React.FC = async () => {
  const session = await auth();
  if (!session) {
    return redirect("/onboarding");
  }

  const proposals = await api.proposal.getProposals();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProposalList initialProposals={proposals ?? []} />
    </Suspense>
  );
};

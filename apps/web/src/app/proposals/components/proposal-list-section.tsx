import { api } from "@/trpc/server";
import { Suspense } from "react";
import { ProposalList } from "./proposal-list";

export const ProposalListSection: React.FC = async () => {
  const proposals = await api.proposal.getProposals();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProposalList initialProposals={proposals ?? []} />
    </Suspense>
  );
};

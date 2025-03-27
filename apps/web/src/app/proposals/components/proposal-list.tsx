"use client";

import { useEffect } from "react";
import { TradeProposal } from "@daiko-ai/shared";
import { ProposalCard } from "./proposal-card";
import { useState } from "react";
import { toast } from "sonner";

type ProposalListProps = {
  initialProposals: TradeProposal[];
};

export const ProposalList: React.FC<ProposalListProps> = ({ initialProposals }) => {
  const [proposals, setProposals] = useState(initialProposals);
  const [expiringProposals, setExpiringProposals] = useState<string[]>([]);

  // 期限切れのプロポーザルを自動的に削除するエフェクト
  useEffect(() => {
    const checkExpiration = () => {
      const now = new Date();

      // 期限切れが近いプロポーザルを特定（30秒以内）
      const aboutToExpire = proposals
        .filter(
          (p) => p.expires_at && p.expires_at.getTime() - now.getTime() < 30000 && !expiringProposals.includes(p.id),
        )
        .map((p) => p.id);

      if (aboutToExpire.length > 0) {
        setExpiringProposals((prev) => [...prev, ...aboutToExpire]);
      }

      // 期限切れのプロポーザルをフィルタリング
      const updatedProposals = proposals.filter((proposal) => {
        if (!proposal.expires_at) return true;
        return proposal.expires_at.getTime() > now.getTime();
      });

      // 期限切れのプロポーザルが見つかった場合のみ更新
      if (updatedProposals.length !== proposals.length) {
        const expiredProposals = proposals.filter((p) => !updatedProposals.some((up) => up.id === p.id));

        // 少し遅延を入れて、アニメーションが見えるようにする
        setTimeout(() => {
          setProposals(updatedProposals);

          // 期限切れになったプロポーザルをトースト通知
          expiredProposals.forEach((p) => {
            toast.error(`Proposal expired`, {
              description: `The proposal "${p.title}" has expired and been removed.`,
            });
          });

          // 期限切れリストからも削除
          setExpiringProposals((prev) => prev.filter((id) => !expiredProposals.some((p) => p.id === id)));
        }, 1000); // 1秒の遅延
      }
    };

    // 初回実行
    checkExpiration();

    // 5秒ごとにチェック（より頻繁にチェックして20秒の期限を逃さないように）
    const intervalId = setInterval(checkExpiration, 5000);

    return () => clearInterval(intervalId);
  }, [proposals, expiringProposals]);

  const handleRemoveProposal = (id: string) => {
    setProposals(proposals.filter((proposal) => proposal.id !== id));
    setExpiringProposals((prev) => prev.filter((propId) => propId !== id));
  };
  return (
    <>
      {proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="transition-all duration-1000">
              <ProposalCard proposal={proposal} onRemove={handleRemoveProposal} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <p className="mb-2 text-lg font-medium">No active proposals</p>
          <p className="text-sm text-muted-foreground">
            All proposals have been reviewed. Check back later for new suggestions.
          </p>
        </div>
      )}
    </>
  );
};

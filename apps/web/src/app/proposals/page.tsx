"use client";

import { Proposal } from "@/types/proposal";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProposalCard } from "./components/proposal-card";

const ProposalsPage: NextPage = () => {
  // 一番上のプロポーザルが40秒で期限切れになるように設定
  const initialProposals: Proposal[] = [
    {
      id: "1",
      title: "Take Profit SOL 5x Long Position on Jupiter",
      summary: "Close 50% of your 5x leveraged SOL long position on Jupiter Exchange to secure profits",
      reason: [
        "Your position is currently up 12.3% ($615) with potential for reversal",
        "On-chain data shows 23% decrease in SOL perpetual open interest over past 12 hours",
        "Whale wallets reduced leveraged long positions by 18% in last 6 hours",
        "This pattern historically preceded 5-8% market corrections",
        "Taking partial profits protects gains while maintaining upside exposure",
        "Decreased capital inflows to Solana derivatives markets detected",
      ],
      sources: [
        { name: "Jupiter Exchange On-Chain Data", url: "#" },
        { name: "Solana Whale Wallet Tracker", url: "#" },
        { name: "Perpetual Market Open Interest Analysis", url: "#" },
      ],
      type: "trade",
      proposedBy: "Daiko AI",
      // 40秒後に期限切れになるように設定
      expires_at: new Date(Date.now() + 1000 * 40),
      financialImpact: {
        currentValue: 5000,
        projectedValue: 5615,
        percentChange: 12.3,
        timeFrame: "immediate",
        riskLevel: "medium",
      },
    },
    {
      id: "2",
      title: "Reduce BONK Exposure Due to Whale Selling",
      summary: "Sell 75% of your 150M BONK tokens ($1,500) to protect against imminent price decline",
      reason: [
        "Your portfolio contains 150M BONK tokens ($1,500), 6% of total holdings",
        "Top 20 wallets reduced holdings by 18.7% in past 36 hours (2.8T tokens)",
        "BONK already experienced 2.1% price decline",
        "This whale selling pattern preceded 25-40% corrections in 7 of 8 historical cases",
        "Optimal selling window is within 24 hours, before retail selling accelerates",
        "Converting 112.5M BONK to USDC while keeping 37.5M for potential recovery is recommended",
      ],
      sources: [
        { name: "BONK Whale Wallet Movement Analysis", url: "#" },
        { name: "Memecoin Volatility Prediction Model", url: "#" },
        { name: "DEX Order Book Depth Analysis", url: "#" },
      ],
      type: "risk",
      proposedBy: "Daiko AI",
      // 新規追加フィールド
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24時間後
      financialImpact: {
        currentValue: 1500,
        projectedValue: 900,
        percentChange: -40,
        timeFrame: "7 days",
        riskLevel: "high",
      },
    },
    {
      id: "3",
      title: "Stake 15.8 SOL in Sanctum's Infinity LST Pool",
      summary: "Earn 6.8% APY by depositing your idle 15.8 SOL ($3,243) into Sanctum's diversified LST staking pool",
      reason: [
        "You have 15.8 SOL ($3,243) sitting idle in your wallet",
        "Sanctum's Infinity pool is the first diversified LST pool on Solana",
        "Dual revenue streams: standard staking yields plus trading fees",
        "Reduced validator risk through diversification",
        "Maintains efficient liquidity through unbonding mechanisms",
        "Current APY of 6.8% generates ~$220 over one year",
        "Low risk rating due to diversified validator exposure",
        "Supports Solana validator ecosystem decentralization",
      ],
      sources: [
        { name: "Sanctum Protocol Documentation", url: "#" },
        { name: "Solana LST Ecosystem Analysis", url: "#" },
        { name: "Infinity Pool Performance Metrics", url: "#" },
      ],
      type: "stake",
      proposedBy: "AI XBT",
      // 新規追加フィールド
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 72), // 72時間後
      financialImpact: {
        currentValue: 3243,
        projectedValue: 3463,
        percentChange: 6.8,
        timeFrame: "1 year",
        riskLevel: "low",
      },
    },
  ];

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
    <main className="safe-main-container px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Proposals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recommendations from multiple AI agents to optimize your portfolio
        </p>
      </div>

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
    </main>
  );
};

export default ProposalsPage;

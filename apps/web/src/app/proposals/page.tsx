import type { ProposalSelect } from "@daiko-ai/shared";
import type { NextPage } from "next";
import { ProposalList } from "./components/proposal-list";
import { ActionButtons } from "../portfolio/components/action-buttons";
import Link from "next/link";
import { Suspense } from "react";
import { AuthAvatar } from "@/components/auth-avater";
import { Skeleton } from "@/components/ui/skeleton";

const ProposalsPage: NextPage = async () => {
  const initialProposals: ProposalSelect[] = [
    {
      id: "1",
      title: "Take Profit SOL 5x Long Position on Jupiter",
      summary: "Close 50% of your 5x leveraged SOL long position on Jupiter Exchange to secure profits",
      reason: [
        "Your position is currently up 12.3% ($615) with potential for reversal",
        "On-chain data shows 23% decrease in SOL perpetual open interest over past 12 hours",
        "Whale wallets reduced leveraged long positions by 18% in last 6 hours",
        // "This pattern historically preceded 5-8% market corrections",
        // "Taking partial profits protects gains while maintaining upside exposure",
        // "Decreased capital inflows to Solana derivatives markets detected",
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
      updatedAt: new Date(),
      createdAt: new Date(),
      userId: "1",
      triggerEventId: "1",
      status: "active",
      contractCall: null,
    },
    {
      id: "2",
      title: "Reduce 80% $BONK Exposure Due to Whale Selling",
      summary: "Sell 75% of your 150M BONK tokens ($1,500) to protect against imminent price decline",
      reason: [
        "Top 20 wallets reduced holdings by 18.7% in the past 36 hours",
        "$BONK founder left the project",
        "$BONK already experienced 2.1% price decline",
        // "This whale selling pattern preceded 25-40% corrections in 7 of 8 historical cases",
        // "Optimal selling window is within 24 hours, before retail selling accelerates",
        // "Converting 112.5M BONK to USDC while keeping 37.5M for potential recovery is recommended",
      ],
      sources: [
        { name: "$BONK Whale Wallet Movement Analysis", url: "#" },
        { name: "$BONK Founder's Exit Announcement", url: "#" },
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
      updatedAt: new Date(),
      createdAt: new Date(),
      userId: "1",
      triggerEventId: "2",
      status: "active",
      contractCall: null,
    },
    // {
    //   id: "3",
    //   title: "Stake 15.8 SOL in Sanctum's Infinity LST Pool",
    //   summary: "Earn 6.8% APY by depositing your idle 15.8 SOL ($3,243) into Sanctum's diversified LST staking pool",
    //   reason: [
    //     "You have 15.8 SOL ($3,243) sitting idle in your wallet",
    //     "Sanctum's Infinity pool is the first diversified LST pool on Solana",
    //     "Dual revenue streams: standard staking yields plus trading fees",
    //     "Reduced validator risk through diversification",
    //     "Maintains efficient liquidity through unbonding mechanisms",
    //     "Current APY of 6.8% generates ~$220 over one year",
    //     "Low risk rating due to diversified validator exposure",
    //     "Supports Solana validator ecosystem decentralization",
    //   ],
    //   sources: [
    //     { name: "Sanctum Protocol Documentation", url: "#" },
    //     { name: "Solana LST Ecosystem Analysis", url: "#" },
    //     { name: "Infinity Pool Performance Metrics", url: "#" },
    //   ],
    //   type: "stake",
    //   proposedBy: "AI XBT",
    //   // 新規追加フィールド
    //   expires_at: new Date(Date.now() + 1000 * 60 * 60 * 72), // 72時間後
    //   financialImpact: {
    //     currentValue: 3243,
    //     projectedValue: 3463,
    //     percentChange: 6.8,
    //     timeFrame: "1 year",
    //     riskLevel: "low",
    //   },
    // },
    {
      id: "4",
      title: "Stake 15.8 SOL in Jupiter's JupSOL for Enhanced Yields",
      summary:
        "Earn 8.24% APY by converting your idle 15.8 SOL ($3,243) to JupSOL, Jupiter's high-yield liquid staking token",
      reason: [
        "You have 15.8 SOL ($3,243) sitting idle in your wallet",
        "JupSOL offers one of the highest yields among Solana LSTs (8.24% current APY)",
        "Zero fees: 0% management fee, 0% validator commission, 0% stake deposit fee",
        // "100% MEV kickback increases your staking rewards",
        // "Helps improve Jupiter's transaction success rates during congestion",
        // "Maintains liquidity - can be used across DeFi or redeemed for SOL anytime",
        // "Low risk with SPL stake pool security and multi-sig program authority",
        // "Validator run by Triton One, a trusted industry expert",
      ],
      sources: [
        { name: "Jupiter JupSOL Documentation", url: "#" },
        { name: "Solana LST Comparison Analysis", url: "#" },
        { name: "JupSOL Performance Metrics", url: "#" },
      ],
      type: "stake",
      proposedBy: "Daiko AI",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 72), // 72時間後
      financialImpact: {
        currentValue: 3243,
        projectedValue: 3510,
        percentChange: 8.24,
        timeFrame: "1 year",
        riskLevel: "low",
      },
      updatedAt: new Date(),
      createdAt: new Date(),
      userId: "1",
      triggerEventId: "3",
      status: "active",
      contractCall: null,
    },
  ];

  return (
    <main className="safe-main-container bg-[#080808] text-white px-3 pt-6">
      <header className="flex items-center justify-between mb-2 px-1">
        <Link href="/profile" className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
            <Suspense fallback={<Skeleton className="w-full h-full rounded-full" />}>
              <AuthAvatar />
            </Suspense>
          </div>
        </Link>
        <ActionButtons />
      </header>

      <ProposalList initialProposals={initialProposals} />
    </main>
  );
};

export default ProposalsPage;

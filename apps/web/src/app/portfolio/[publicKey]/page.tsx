import { ActionButtons } from "../components/action-buttons";
import { CollectiblesTab } from "../components/collectibles-tab";
import { Tabs } from "../components/tabs";
import { TokensTab } from "../components/tokens-tab";

import type { NextPage } from "next";

import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import Link from "next/link";

type PortfolioPageProps = {
  params: Promise<{
    publicKey: string;
  }>;
};

const PortfolioPage: NextPage<PortfolioPageProps> = async ({ params }) => {
  // Get the wallet address from params
  const { publicKey } = await params;
  const walletAddress = publicKey;

  const session = await auth();
  const user = session?.user;

  // tRPCのAPIを使用して資産情報を取得 (RSCでの呼び出し)
  const portfolioData = await api.portfolio.getUserPortfolio({
    walletAddress,
    forceRefresh: false,
  });

  // tRPCのAPIを使用してPnLデータを取得 (RSCでの呼び出し)
  const pnlData = await api.portfolio.getUserPnl({
    walletAddress,
    period: "7d",
  });

  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  // ポートフォリオの合計価値
  const totalValue = parseFloat(portfolioData.total_value_usd || "0");

  // 仮のデータ (API実装に応じて調整)
  const dailyChange = 5.46; // 仮の値
  const dailyChangeValue = totalValue * (dailyChange / 100);

  // NFTsは現在APIから返されていない場合は空配列を使用
  const nfts: any[] = [];

  return (
    <main className="safe-main-container px-4 pt-6 flex flex-col gap-6">
      <section className="flex items-center justify-between">
        <Link href="/profile" className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
            <img src={user?.image} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </Link>
        <ActionButtons />
      </section>

      <section className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">{shortAddress}</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <h2 className="text-xl font-bold text-white mb-2">Balance</h2>
          <div className="text-4xl font-bold text-white">${totalValue.toLocaleString()}</div>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`text-sm font-medium px-2 py-0.5 rounded-md ${dailyChange > 0 ? "bg-[#2DD48B]/8 text-[#2DD48B]" : "bg-[#CD2828]/12 text-[#CD2828]"}`}
            >
              {dailyChange > 0 ? "+" : ""}
              {dailyChange.toFixed(2)}%
            </span>
            <span className={`text-lg font-semibold ${dailyChange > 0 ? "text-[#2DD48B]" : "text-[#CD2828]"}`}>
              {dailyChange > 0 ? "+" : "-"}${Math.abs(dailyChangeValue).toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* Use Tabs component with Composition Pattern */}
      <Tabs tokensTab={<TokensTab assets={portfolioData.tokens} />} collectiblesTab={<CollectiblesTab nfts={nfts} />} />
    </main>
  );
};

export default PortfolioPage;

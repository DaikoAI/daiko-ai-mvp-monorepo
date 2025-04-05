import { CopyButton } from "@/components/copy-button";

import type { NextPage } from "next";

import { api } from "@/trpc/server";
import { AssetList } from "../components/asset-list";
import { PnLChart } from "../components/pnl-chart";
import { RefreshButton } from "../components/refresh-button";

type PortfolioPageProps = {
  params: Promise<{
    publicKey: string;
  }>;
};

const PortfolioPage: NextPage<PortfolioPageProps> = async ({ params }) => {
  // Get the wallet address from params
  const { publicKey } = await params;
  const walletAddress = publicKey || "86oHY5tUBn4gqHSQAZJSUX6MU7WJVpg8bn8MZ4jKEb63";

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

  return (
    <main className="safe-main-container px-4 pt-6 flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">{shortAddress}</p>
            <CopyButton value={walletAddress} />
          </div>
          <RefreshButton />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <PnLChart initialData={pnlData} />
      </section>

      <AssetList assets={portfolioData.tokens} />

      {/* <NFTAssets nfts={nfts} />

      <section>
        <PerpetualPositions />
      </section>

      <section>
        <DefiPositions />
      </section> */}
    </main>
  );
};

export default PortfolioPage;

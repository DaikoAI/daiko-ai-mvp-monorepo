import { CopyButton } from "@/components/copy-button";

import type { NextPage } from "next";

import { getAssetsByOwner } from "@/lib/helius";
import { AssetList } from "../components/asset-list";
import { DefiPositions } from "../components/defi-positions";
import { NFTAssets } from "../components/nft-assets";
import { PerpetualPositions } from "../components/perpetual-positions";
import { PnLChart } from "../components/pnl-chart";
import { PortfolioChart } from "../components/portfolio-chart";
import { RefreshButton } from "../components/refresh-button";

type PortfolioPageProps = {
  params: Promise<{
    publicKey: string;
  }>;
};

const PortfolioPage: NextPage<PortfolioPageProps> = async ({ params }) => {
  // Mock data for portfolio
  const { publicKey } = await params;
  const walletAddress = publicKey || "86oHY5tUBn4gqHSQAZJSUX6MU7WJVpg8bn8MZ4jKEb63";

  const assets = await getAssetsByOwner(walletAddress);
  const fts = assets.filter((asset) => asset.interface === "FungibleToken" && "price_info" in asset.token_info);
  const nfts = assets.filter((asset) => asset.interface === "ProgrammableNFT");

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
        <PortfolioChart assets={assets} />
        <PnLChart />
      </section>

      <AssetList assets={fts} />

      <NFTAssets nfts={nfts} />

      <section>
        <PerpetualPositions />
      </section>

      <section>
        <DefiPositions />
      </section>
    </main>
  );
};

export default PortfolioPage;

import { api } from "@/trpc/server";
import { AssetList } from "./asset-list";

type TokensTabProps = {
  walletAddress: string;
};

export const TokensTabComponent: React.FC<TokensTabProps> = async ({ walletAddress }) => {
  // tRPCのAPIを使用して資産情報を取得 (RSCでの呼び出し)
  const portfolioData = await api.portfolio.getUserPortfolio({
    walletAddress,
    forceRefresh: false,
  });

  return <AssetList assets={portfolioData.tokens} />;
};

const TokensTabSkeleton: React.FC = () => {
  return <AssetList.Skeleton />;
};

export const TokensTab = Object.assign(TokensTabComponent, {
  Skeleton: TokensTabSkeleton,
});

import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { AssetList } from "./asset-list";

export const TokensTabComponent: React.FC = async () => {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  const walletAddress = session.user.walletAddress;

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

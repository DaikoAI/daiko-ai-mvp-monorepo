import type { RouterOutputs } from "@/trpc/react";
import { AssetList } from "./asset-list";

type TokensTabProps = {
  assets: RouterOutputs["portfolio"]["getUserPortfolio"]["tokens"];
};

export const TokensTab: React.FC<TokensTabProps> = ({ assets }) => {
  return <AssetList assets={assets} />;
};

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/trpc/react";
import { cn } from "@/utils";

type AssetListProps = {
  assets: RouterOutputs["portfolio"]["getUserPortfolio"]["tokens"];
};

export const AssetListComponent: React.FC<AssetListProps> = ({ assets }) => {
  return (
    <section className="space-y-2">
      {assets.map((asset, index) => (
        <Card
          key={asset.token_address || index}
          className="backdrop-blur-sm bg-white/12 rounded-2xl border-none transition-all duration-200 hover:shadow-md"
        >
          <div className="flex cursor-pointer items-center justify-between p-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 p-0.5">
                <img src={asset.icon_url} alt={asset.token} className="h-full w-full object-cover rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{asset.token}</h3>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-[#9DA4AE]">
                    $
                    {parseFloat(asset.price_usd || "0").toLocaleString("en-US", {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                  </p>
                  {asset.price_usd && (
                    <div
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-md",
                        parseFloat(asset.price_usd) > 0
                          ? "bg-[#2DD48B]/8 text-[#2DD48B]"
                          : parseFloat(asset.price_usd) < 0
                            ? "bg-[#CD2828]/12 text-[#CD2828]"
                            : "",
                      )}
                    >
                      {parseFloat(asset.price_usd) > 0 ? "+" : ""}
                      {parseFloat(asset.price_usd).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="text-right">
                <p className="font-medium text-base text-white">${parseFloat(asset.value_usd).toLocaleString()}</p>
                <p className="text-sm text-[#9DA4AE]">
                  {parseFloat(asset.balance).toLocaleString()} {asset.token}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
};

const AssetListSkeleton: React.FC = () => {
  return (
    <section className="space-y-2">
      {[...Array(5)].map((_, index) => (
        <Card key={index} className="backdrop-blur-sm bg-white/12 rounded-2xl border-none transition-all duration-200">
          <div className="flex cursor-pointer items-center justify-between p-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 p-0.5">
                <Skeleton className="h-full w-full rounded-full" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
};

export const AssetList = Object.assign(AssetListComponent, {
  Skeleton: AssetListSkeleton,
});

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/trpc/react";
import { cn } from "@/utils";
import Image from "next/image";

type AssetListProps = {
  assets: RouterOutputs["portfolio"]["getUserPortfolio"]["tokens"];
};

export const AssetListComponent: React.FC<AssetListProps> = ({ assets }) => {
  return (
    <section className="space-y-2 overscroll-contain">
      {assets.map((asset, index) => (
        <Card
          key={asset.tokenAddress || index}
          className="backdrop-blur-sm bg-white/12 rounded-2xl border-none transition-all duration-200 hover:shadow-md"
        >
          <div className="flex cursor-pointer items-center justify-between p-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 p-0.5">
                <Image
                  src={asset.iconUrl}
                  alt={asset.symbol}
                  height={40}
                  width={40}
                  className="h-full w-full object-cover rounded-full"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate">{asset.symbol}</h3>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-[#9DA4AE] truncate">
                    $
                    {parseFloat(asset.priceUsd || "0").toLocaleString("en-US", {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                  </p>
                  {asset.priceChange24h && (
                    <div
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-md truncate flex-shrink-0",
                        parseFloat(asset.priceChange24h) > 0
                          ? "bg-[#2DD48B]/8 text-[#2DD48B]"
                          : parseFloat(asset.priceChange24h) < 0
                            ? "bg-[#CD2828]/12 text-[#CD2828]"
                            : "",
                      )}
                    >
                      {parseFloat(asset.priceChange24h) > 0 ? "+" : ""}
                      {parseFloat(asset.priceChange24h).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center min-w-0 ml-2">
              <div className="text-right min-w-0">
                <p className="font-medium text-base text-white truncate">
                  ${parseFloat(asset.valueUsd).toLocaleString()}
                </p>
                <p className="text-sm text-[#9DA4AE] truncate">
                  {parseFloat(asset.balance).toLocaleString()} {asset.symbol}
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
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="backdrop-blur-sm bg-white/12 rounded-2xl border-none transition-all duration-200">
          <div className="flex cursor-pointer items-center justify-between p-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black/20 p-0.5">
                <Skeleton className="h-full w-full rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-6 w-20 mb-1" />
                <div className="flex items-center gap-1 min-w-0">
                  <Skeleton className="h-4 w-16 flex-shrink-0" />
                </div>
              </div>
            </div>
            <div className="flex items-center ml-2 flex-shrink-0">
              <div className="text-right">
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
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

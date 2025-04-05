import { Card } from "@/components/ui/card";
import type { RouterOutputs } from "@/trpc/react";
import { cn } from "@/utils";

type AssetListProps = {
  assets: RouterOutputs["portfolio"]["getUserPortfolio"]["tokens"];
};

export const AssetList: React.FC<AssetListProps> = ({ assets }) => {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Holdings</h2>
      <div className="space-y-3">
        {assets.map((asset, index) => (
          <Card key={asset.token_address || index} glass className="transition-all duration-200 hover:shadow-md">
            <div className="flex cursor-pointer items-center justify-between p-4">
              <div className="flex items-center">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 p-0.5">
                  <img src={asset.icon_url} alt={asset.token} className="h-full w-full object-cover rounded-full" />
                </div>
                <div>
                  <h3 className="font-medium">
                    <span className="text-primary">{asset.token}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {parseFloat(asset.balance).toLocaleString()} {asset.token}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="mr-3 text-right">
                  <p className="font-medium">${parseFloat(asset.value_usd).toLocaleString()}</p>
                  {asset.price_usd && (
                    <p
                      className={cn(
                        "text-sm font-medium",
                        parseFloat(asset.price_usd) > 0
                          ? "value-up"
                          : parseFloat(asset.price_usd) < 0
                            ? "value-down"
                            : "",
                      )}
                    >
                      {parseFloat(asset.price_usd) > 0 ? "+" : ""}
                      {parseFloat(asset.price_usd).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

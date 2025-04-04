import { Card } from "@/components/ui/card";
import type { Asset } from "@/types";
import { cn } from "@/utils";

type AssetListProps = {
  assets: Asset[];
};

export const AssetList: React.FC<AssetListProps> = ({ assets }) => {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Holdings</h2>
      <div className="space-y-3">
        {assets.map((asset) => (
          <Card key={asset.id} glass className="transition-all duration-200 hover:shadow-md">
            <div className="flex cursor-pointer items-center justify-between p-4">
              <div className="flex items-center">
                <img
                  src={asset.content.links.image}
                  alt={asset.content.metadata.name}
                  className="mr-3 h-10 w-10 rounded-full object-contain bg-black/20 p-0.5"
                  loading="lazy"
                />
                <div>
                  <h3 className="font-medium">
                    <span className="text-primary">{asset.content.metadata.symbol}</span>{" "}
                    <span className="text-sm text-muted-foreground">- {asset.content.metadata.name}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {asset.token_info.symbol === "BONK"
                      ? asset.token_info.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })
                      : asset.token_info.balance.toLocaleString()}{" "}
                    {asset.token_info.symbol}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="mr-3 text-right">
                  <p className="font-medium">${asset.token_info?.price_info?.total_price.toLocaleString()}</p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      asset.token_info?.price_info?.price_per_token && asset.token_info?.price_info?.price_per_token > 0
                        ? "value-up"
                        : asset.token_info?.price_info?.price_per_token &&
                            asset.token_info?.price_info?.price_per_token < 0
                          ? "value-down"
                          : "",
                    )}
                  >
                    {asset.token_info?.price_info?.price_per_token && asset.token_info?.price_info?.price_per_token > 0
                      ? "+"
                      : ""}
                    {asset.token_info?.price_info?.price_per_token}%
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

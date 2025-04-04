import { Card, CardContent } from "@/components/ui/card";
import type { Asset } from "@/types";

type NFTAssetsProps = {
  nfts: Asset[];
};

export const NFTAssets: React.FC<NFTAssetsProps> = ({ nfts }) => {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">NFTs</h2>
      <Card className="p-4">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-4">No NFTs found</p>
            ) : (
              nfts.map((nft) => (
                <Card key={nft.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={nft.content.links.image}
                      alt={nft.content.metadata.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">{nft.content.metadata.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted-foreground">
                        {nft.grouping[0]?.collection_metadata?.name || nft.content.metadata.symbol || ""}
                      </p>
                      {nft.token_info.price_info && (
                        <p className="text-sm font-medium">
                          $
                          {nft.token_info.price_info.total_price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

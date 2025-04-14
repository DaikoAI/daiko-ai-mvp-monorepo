import { Card } from "@/components/ui/card";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export const CollectiblesTab: React.FC = async () => {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  const walletAddress = session.user.walletAddress;
  const nfts = await api.portfolio.getUserNfts({
    walletAddress,
  });

  if (nfts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No collectibles found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {nfts.map((nft, index) => (
        <Card key={nft.id || index} className="backdrop-blur-sm bg-white/12 rounded-2xl border-none overflow-hidden">
          <div className="aspect-square">
            <img
              src={nft.image_url || "/placeholder-nft.png"}
              alt={nft.name || "NFT"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3">
            <h3 className="font-medium text-white truncate">{nft.name || `NFT #${index + 1}`}</h3>
            {nft.collection && <p className="text-xs text-[#9DA4AE] truncate">{nft.collection.name}</p>}
          </div>
        </Card>
      ))}
    </div>
  );
};

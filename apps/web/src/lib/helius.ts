import { env } from "@/env";
import type { Asset } from "@/types";

export const getAssetsByOwner = async (address: string): Promise<Asset[]> => {
  const apiKey = env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error("HELIUS_API_KEY not found in environment variables");
  }

  const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "force-cache",
    next: {
      revalidate: 60 * 60 * 24, // 24時間
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "get-assets",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: address,
        page: 1,
        limit: 100,
        displayOptions: {
          showFungible: true,
          showCollectionMetadata: true,
          //   showGrandTotal: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} - ${response.statusText}`);
  }

  const data = (await response.json()) as { result: { items: any[] } };

  return data.result.items;
};

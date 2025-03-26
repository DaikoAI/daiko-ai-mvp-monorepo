import { Tool } from "@langchain/core/tools";
import type { SolanaAgentKit } from "solana-agent-kit";
import { PublicKey } from "@solana/web3.js";

export class SolanaGetAllAssetsByOwner extends Tool {
    name = "solana_get_all_assets_by_owner";
    description = `Get all assets owned by a specific wallet address.
    Inputs (JSON string):
    - owner: string, the wallet address of the owner, e.g., "4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t" (required)
    - limit: number, the maximum number of assets to retrieve (optional)

    Outputs:
    - status: string, "success" or "error"
    - message: string, a message describing the result
    - assets: array of objects, each representing an asset with the following properties:
        "name": string, the name of the asset
        "symbol": string, the symbol of the asset
        "amount": number, the balance of the asset
        "decimals": number, the number of decimals of the asset
        "price_per_token": number, the price per token of the asset
        "total_value_usdc": number, the total value of the asset in USDC
        "mint": string, the mint address of the asset
        "token_account": string, the token account address of the asset
    `;

    constructor(private solanaKit: SolanaAgentKit) {
        super();
    }

    protected async _call(input: string): Promise<string> {
        try {
            // const { owner, limit } = JSON.parse(input);
            // TODO: somehow caller node cannot pass the correct json object to this tool, so we're just going to use the input as the owner
            const owner = input;
            const ownerPubkey = new PublicKey(owner);

            const apiKey = this.solanaKit.config.HELIUS_API_KEY;
            if (!apiKey) {
                throw new Error("HELIUS_API_KEY not found in environment variables");
            }

            const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: "get-assets",
                    method: "getAssetsByOwner",
                    params: {
                        ownerAddress: ownerPubkey.toString(),
                        page: 1,
                        limit: 100,
                        displayOptions: {
                            showFungible: true,
                            showCollectionMetadata: true,
                        },
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} - ${response.statusText}`);
            }

            // biome-ignore lint/suspicious/noExplicitAny: use any
            const data = (await response.json()) as { result: { items: any[] } };
            const assets = data?.result?.items.filter((asset) => asset.token_info);

            // Format assets with proper decimals and required information
            const formattedAssets = assets.map((asset) => {
                const tokenInfo = asset.token_info;
                const metadata = asset.content?.metadata;

                // Calculate actual balance considering decimals
                const rawBalance = tokenInfo?.balance;
                const decimals = tokenInfo?.decimals;
                const actualBalance = rawBalance / 10 ** decimals;

                // Calculate total value in USDC
                const pricePerToken = tokenInfo?.price_info?.price_per_token || 0;
                const totalValue = tokenInfo?.price_info?.total_price || 0;

                return {
                    name: tokenInfo?.symbol || metadata?.symbol,
                    symbol: tokenInfo?.symbol,
                    amount: actualBalance,
                    decimals: decimals,
                    price_per_token: pricePerToken,
                    total_value_usdc: totalValue,
                    mint: asset.id,
                    // Additional useful information for the agent
                    token_account: tokenInfo?.associated_token_address,
                };
            });

            // Sort by total value (descending)
            formattedAssets.sort((a, b) => b.total_value_usdc - a.total_value_usdc);

            return JSON.stringify({
                status: "success",
                message: "Assets retrieved successfully",
                assets: formattedAssets,
            });

            // biome-ignore lint/suspicious/noExplicitAny: use any
        } catch (error: any) {
            return JSON.stringify({
                status: "error",
                message: error.message,
                code: error.code || "UNKNOWN_ERROR",
            });
        }
    }
}

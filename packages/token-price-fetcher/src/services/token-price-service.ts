import { TokenSelect, db, tokenPriceHistory, tokenPricesTable } from "@daiko-ai/shared";
import { sql } from "drizzle-orm";

// Jupiterの価格レスポンスの型定義
interface JupiterPriceResponse {
  data: {
    [tokenAddress: string]: {
      id: string;
      type: string;
      price: string;
    };
  };
  timeTaken: number;
}

interface TokenPriceUpdate {
  tokenAddress: string;
  priceUsd: string;
  lastUpdated: Date;
  source: string;
}

interface TokenPriceHistoryInsert {
  token_address: string;
  price_usd: string;
  timestamp: Date;
  source: string;
}

export class TokenPriceService {
  private jupiterApiUrl: string;

  constructor() {
    this.jupiterApiUrl = process.env.JUPITER_API_URL || "https://api.jup.ag/price/v2";
  }

  /**
   * 全トークンの価格を更新する
   */
  async updateAllTokenPrices(): Promise<void> {
    try {
      console.log("トークン価格の更新を開始します...");

      // DBから全トークンを取得
      const tokens = await db.query.tokensTable.findMany();
      if (tokens.length === 0) {
        console.log("更新するトークンがありません");
        return;
      }

      console.log(`${tokens.length}個のトークンの価格を更新します`);

      // バッチでトークンを処理（APIレート制限を考慮）
      const batchSize = 30;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        await this.updateTokenPricesBatch(batch);

        // APIレート制限を考慮して少し待機
        if (i + batchSize < tokens.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log("トークン価格の更新が完了しました");
    } catch (error) {
      console.error("トークン価格の更新中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * 指定されたトークンのバッチの価格を更新する
   */
  private async updateTokenPricesBatch(tokens: TokenSelect[]): Promise<void> {
    try {
      // トークンアドレスのリストを作成
      const tokenAddresses = tokens.map((token) => token.address);
      const addressesParam = tokenAddresses.join(",");

      // Jupiterの価格APIを呼び出す
      const response = await fetch(`${this.jupiterApiUrl}?ids=${addressesParam}`);

      if (!response.ok) {
        throw new Error(`Jupiter API から価格を取得できませんでした: ${response.status} ${response.statusText}`);
      }

      const priceData = (await response.json()) as JupiterPriceResponse;
      const now = new Date();

      // 更新と挿入するレコードを準備
      const priceInserts: TokenPriceUpdate[] = [];
      const historyInserts: TokenPriceHistoryInsert[] = [];

      for (const token of tokens) {
        const tokenPrice = priceData.data[token.address];
        if (!tokenPrice || !tokenPrice.price) {
          console.warn(`${token.symbol} (${token.address}) の価格が見つかりませんでした`);
          continue;
        }

        // 価格履歴用のレコードを準備
        historyInserts.push({
          token_address: token.address,
          price_usd: tokenPrice.price,
          timestamp: now,
          source: "jupiter",
        });

        // 新しい価格レコードを準備（UPSERTで処理）
        priceInserts.push({
          tokenAddress: token.address,
          priceUsd: tokenPrice.price,
          lastUpdated: now,
          source: "jupiter",
        });

        console.log(`${token.symbol} (${token.address}): ${tokenPrice.price} USD に更新準備完了`);
      }

      // 一括でデータを更新
      if (priceInserts.length > 0) {
        await db
          .insert(tokenPricesTable)
          .values(priceInserts)
          .onConflictDoUpdate({
            target: tokenPricesTable.tokenAddress,
            set: {
              priceUsd: sql`EXCLUDED.price_usd`,
              lastUpdated: sql`EXCLUDED.last_updated`,
              source: sql`EXCLUDED.source`,
            },
          });
      }

      // 価格履歴を一括で挿入
      if (historyInserts.length > 0) {
        await db.insert(tokenPriceHistory).values(historyInserts);
      }

      console.log(`${historyInserts.length}個のトークン価格を一括更新しました`);
    } catch (error) {
      console.error("トークン価格のバッチ更新中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * 特定のトークンの価格を取得する
   */
  async getTokenPrice(tokenAddress: string): Promise<string | null> {
    try {
      // Jupiter APIから価格を取得
      const response = await fetch(`${this.jupiterApiUrl}?ids=${tokenAddress}`);

      if (!response.ok) {
        throw new Error(`Jupiter API から価格を取得できませんでした: ${response.status} ${response.statusText}`);
      }

      const priceData = (await response.json()) as JupiterPriceResponse;
      const tokenPrice = priceData.data[tokenAddress];

      if (tokenPrice && tokenPrice.price) {
        return tokenPrice.price;
      }

      return null;
    } catch (error) {
      console.error(`トークン ${tokenAddress} の価格取得中にエラーが発生しました:`, error);
      return null;
    }
  }
}

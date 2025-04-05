import { inArray } from "drizzle-orm";
import { db, tokensTable, userBalancesTable } from "../db";

/**
 * ユーザーの初期ポートフォリオをセットアップする共通関数
 * Auth.js での新規ユーザー登録時、および seed.ts でのテストユーザー作成時に使用
 *
 * @param userId ポートフォリオを設定するユーザーID
 * @param options カスタム設定オプション
 */
export async function setupInitialPortfolio(
  userId: string,
  options?: {
    // カスタム残高設定（指定された場合はデフォルト設定より優先）
    customBalances?: Record<string, string>;
    // 特定のトークンシンボルのみを使用
    specificSymbols?: string[];
  },
): Promise<void> {
  try {
    let tokens;

    // 特定のシンボルが指定された場合、それらのトークンのみを取得
    if (options?.specificSymbols && options.specificSymbols.length > 0) {
      tokens = await db.select().from(tokensTable).where(inArray(tokensTable.symbol, options.specificSymbols));
    } else {
      // すべてのトークンを取得
      tokens = await db.select().from(tokensTable);
    }

    if (!tokens.length) {
      console.log("初期ポートフォリオのセットアップに必要なトークンが見つかりませんでした");
      return;
    }

    // デフォルトの残高設定
    const defaultBalances: Record<string, string> = {
      SOL: "10", // 基本トークン
      USDC: "1000", // ステーブルコイン
      BONK: "10000", // ミームコイン
      $WIF: "20", // ミームコイン
      JUP: "200", // DEXトークン
      RAY: "200", // DEXトークン
      PYTH: "200", // オラクル
      JTO: "100", // ステーキング関連
      TRUMP: "20", // その他
      GRASS: "20", // その他
      INF: "20", // その他
      jitoSOL: "0.5", // ステーキングトークン
      jupSOL: "0.5", // ステーキングトークン
    };

    // 各トークンに対して残高を作成
    const initialBalances = tokens.map((token) => {
      // カスタム残高が指定されている場合はそれを使用し、
      // なければデフォルト残高を使用、どちらもなければ0
      const balance = options?.customBalances?.[token.symbol] ?? defaultBalances[token.symbol] ?? "0";

      return {
        userId,
        tokenAddress: token.address,
        balance,
      };
    });

    // 残高が0より大きいもののみ挿入
    const balancesToInsert = initialBalances.filter(
      (balance) => balance.balance !== "0" && parseFloat(balance.balance) > 0,
    );

    // ユーザー残高テーブルに挿入
    for (const balance of balancesToInsert) {
      await db.insert(userBalancesTable).values(balance);
    }

    console.log(`ユーザー ${userId} の初期ポートフォリオを設定しました`);
  } catch (error) {
    console.error("初期ポートフォリオのセットアップ中にエラーが発生しました:", error);
    throw error;
  }
}

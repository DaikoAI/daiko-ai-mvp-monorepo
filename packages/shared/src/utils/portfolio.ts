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
    customBalances?: Record<string, number>;
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
    const defaultBalances: Record<string, number> = {
      SOL: 240000,
      JUP: 20000,
      JTO: 20000,
      RAY: 20000,
      HNT: 20000,
      PYTH: 20000,
      TRUMP: 20000,
      WIF: 20000,
      W: 20000,
      MEW: 20000,
      POPCAT: 20000,
      ORCA: 20000,
      ZEUS: 20000,
      KMNO: 20000,
      WBTC: 20000,
      USDC: 200000,
      BONK: 20000,
      WSUI: 20000,
      BIO: 20000,
      LAYER: 20000,
      AIXBT: 20000,
      ACT: 20000,
      Fartcoin: 20000,
    };

    // 各トークンに対して残高を作成
    const initialBalances = tokens.map((token) => {
      // カスタム残高が指定されている場合はそれを使用し、
      // なければデフォルト残高を使用、どちらもなければ0
      const balance = options?.customBalances?.[token.symbol] ?? defaultBalances[token.symbol] ?? 0;

      return {
        userId,
        tokenAddress: token.address,
        balance: balance.toString(),
      };
    });

    // 残高が0より大きいもののみフィルタリング
    const balancesToInsert = initialBalances.filter(({ balance }) => parseFloat(balance) > 0);

    // ユーザー残高テーブルに一括挿入
    if (balancesToInsert.length > 0) {
      await db.insert(userBalancesTable).values(balancesToInsert);
    }

    console.log(`ユーザー ${userId} の初期ポートフォリオを設定しました`);
  } catch (error) {
    console.error("初期ポートフォリオのセットアップ中にエラーが発生しました:", error);
    throw error;
  }
}

import { inArray } from "drizzle-orm";
import { db, tokenPricesTable, tokensTable, userBalancesTable } from "../db";

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
    // カスタム残高設定（指定された場合はデフォルト設定より優先）- USD建て
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

    // トークン価格を取得
    const tokenPrices = await db
      .select()
      .from(tokenPricesTable)
      .where(
        inArray(
          tokenPricesTable.tokenAddress,
          tokens.map((t) => t.address),
        ),
      );

    // 価格マップを作成
    const priceMap = new Map(tokenPrices.map((tp) => [tp.tokenAddress, parseFloat(tp.priceUsd)]));

    // デフォルトのUSD建て残高設定
    const defaultUsdBalances: Record<string, number> = {
      SOL: 2000, // $2,000 worth of SOL
      JUP: 1000, // $1,000 worth of JUP
      JTO: 1000, // $1,000 worth of JTO
      RAY: 1000, // $1,000 worth of RAY
      HNT: 1000, // $1,000 worth of HNT
      PYTH: 1000, // $1,000 worth of PYTH
      TRUMP: 1000, // $1,000 worth of TRUMP
      WIF: 1000, // $1,000 worth of WIF
      W: 1000, // $1,000 worth of W
      MEW: 1000, // $1,000 worth of MEW
      POPCAT: 1000, // $1,000 worth of POPCAT
      ORCA: 1000, // $1,000 worth of ORCA
      ZEUS: 1000, // $1,000 worth of ZEUS
      KMNO: 1000, // $1,000 worth of KMNO
      WBTC: 2000, // $2,000 worth of WBTC
      USDC: 2000, // $2,000 worth of USDC
      BONK: 1000, // $1,000 worth of BONK
      WSUI: 1000, // $1,000 worth of WSUI
      BIO: 1000, // $1,000 worth of BIO
      LAYER: 1000, // $1,000 worth of LAYER
      AIXBT: 1000, // $1,000 worth of AIXBT
      ACT: 1000, // $1,000 worth of ACT
    };

    // 各トークンに対して残高を作成
    const initialBalances = tokens.map((token) => {
      // カスタム残高（USD建て）が指定されている場合はそれを使用し、
      // なければデフォルト残高を使用、どちらもなければ0
      const usdAmount = options?.customBalances?.[token.symbol] ?? defaultUsdBalances[token.symbol] ?? 0;
      const price = priceMap.get(token.address) || 0;

      // トークン数量を計算（USD金額 ÷ トークン価格）
      // 価格が0の場合は0を設定
      const tokenAmount = price > 0 ? usdAmount / price : 0;

      return {
        userId,
        tokenAddress: token.address,
        balance: tokenAmount.toString(),
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

import { eq } from "drizzle-orm";
import { db } from "./connection";
import { InterestRateInsert, interestRatesTable } from "./schema/interest_rates";
import { NewsSiteInsert, newsSiteTable } from "./schema/news_sites";
import { TokenInsert, tokensTable } from "./schema/tokens";
import { UserBalanceInsert, userBalancesTable } from "./schema/user_balances";
import { UserInsert, UserSelect, usersTable } from "./schema/users";
import { XAccountInsert, xAccountTable } from "./schema/x_accounts";

const seedUsers = async () => {
  try {
    // ユーザーデータ
    const users: UserInsert[] = [
      {
        name: "山田太郎",
        age: 30,
        email: "yamada@example.com",
        tradeStyle: "conservative",
        totalAssetUsd: 1000000,
        cryptoInvestmentUsd: 100000,
        walletAddress: "Fgkki5sVbKpdLF28nvahDyrYeUQ5Cn7VJ8WTXHzLWEB5",
      },
      {
        name: "佐藤花子",
        age: 25,
        email: "sato@example.com",
        tradeStyle: "moderate",
        totalAssetUsd: 1000000,
        cryptoInvestmentUsd: 100000,
        walletAddress: "6R57iMy4cxpMBWu6wNP8648HoTEbim8fDK2ZWFdYPJ5D",
      },
      {
        name: "鈴木一郎",
        age: 35,
        email: "suzuki@example.com",
        tradeStyle: "aggressive",
        totalAssetUsd: 1000000,
        cryptoInvestmentUsd: 100000,
        walletAddress: "6yVF82TqGTwvix2tCGzxUhWGKkBB185sTU7A2bvACnF2",
      },
    ];

    // ユーザー挿入
    console.log("ユーザーデータを挿入中...");

    // すでに存在するユーザーを確認
    const existingUsers = await db.select().from(usersTable);
    const generatedUsers: UserSelect[] = [];

    for (const user of users) {
      // メールアドレスによる重複チェック
      const existingUser = existingUsers.find((u) => u.email === user.email);

      if (!existingUser) {
        const [generatedUser] = await db.insert(usersTable).values(user).returning();
        generatedUsers.push(generatedUser);
        console.log(`ユーザー "${user.name}" を挿入しました`);
      } else {
        console.log(`ユーザー "${user.name}" (${user.email}) は既に存在します。スキップします。`);
      }
    }

    return generatedUsers;
  } catch (error) {
    console.error("ユーザーデータの挿入中にエラーが発生しました:", error);
    throw error;
  }
};

const seedTokens = async () => {
  try {
    // トークンデータ
    const tokens: TokenInsert[] = [
      {
        address: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Wrapped SOL",
        decimals: 9,
        type: "normal",
        iconUrl:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      },
      {
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
      },
      {
        address: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
        symbol: "TRUMP",
        name: "OFFICIAL TRUMP",
        decimals: 6,
        type: "normal",
        iconUrl: "https://arweave.net/VQrPjACwnQRmxdKBTqNwPiyo65x7LAT773t8Kd7YBzw",
      },
      {
        address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        symbol: "JUP",
        name: "Jupiter",
        decimals: 6,
        type: "normal",
        iconUrl: "https://static.jup.ag/jup/icon.png",
      },
      {
        address: "Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs",
        symbol: "GRASS",
        name: "Grass",
        decimals: 9,
        type: "normal",
        iconUrl: "https://static.grassfoundation.io/grass-logo.png",
      },
      {
        address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
        symbol: "$WIF",
        name: "dogwifhat",
        decimals: 6,
        type: "normal",
        iconUrl: "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link",
      },
      {
        address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        symbol: "BONK",
        name: "Bonk",
        decimals: 5,
        type: "normal",
        iconUrl: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
      },
      {
        address: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
        symbol: "JTO",
        name: "JITO",
        decimals: 9,
        type: "normal",
        iconUrl: "https://metadata.jito.network/token/jto/image",
      },
      {
        address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
        symbol: "RAY",
        name: "Raydium",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
      },
      {
        address: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
        symbol: "PYTH",
        name: "Pyth Network",
        decimals: 6,
        type: "normal",
        iconUrl: "https://pyth.network/token.svg",
      },
      {
        address: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
        symbol: "jupSOL",
        name: "Jupiter Staked SOL",
        decimals: 9,
        type: "liquid_staking",
        iconUrl: "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fstatic.jup.ag%2FjupSOL%2Ficon.png&dpr=2",
      },
      {
        address: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
        symbol: "jitoSOL",
        name: "Jito Staked SOL",
        decimals: 9,
        type: "liquid_staking",
        iconUrl:
          "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fstorage.googleapis.com%2Ftoken-metadata%2FJitoSOL-256.png&dpr=2",
      },
      {
        address: "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
        symbol: "INF",
        name: "Infinity",
        decimals: 9,
        type: "liquid_staking",
        iconUrl: "https://bafkreiflz2xxkfn33qjch2wj55bvbn33q3s4mmb6bye5pt3mpgy4t2wg4e.ipfs.nftstorage.link/",
      },
    ];

    const existingTokens = await db.select().from(tokensTable);

    for (const token of tokens) {
      const existingToken = existingTokens.find((t) => t.address === token.address);

      if (!existingToken) {
        await db.insert(tokensTable).values(token);
        console.log(`トークン "${token.name}" (${token.symbol}) を挿入しました`);
      } else {
        console.log(`トークン "${token.name}" (${token.symbol}) は既に存在します。スキップします。`);
      }
    }

    return tokens;
  } catch (error) {
    console.error("トークンデータの挿入中にエラーが発生しました:", error);
    throw error;
  }
};

const seedXAccounts = async (generatedUsers: UserSelect[]) => {
  // すでに存在するXアカウントを確認
  const existingAccounts = await db.select().from(xAccountTable);
  // Xアカウントデータ
  const xAccounts: XAccountInsert[] = [
    {
      id: "DriftProtocol",
      displayName: "Drift Protocol",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1884910583621042176/mdGXo6iq_400x400.png",
      lastTweetId: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "FlashTrade_",
      displayName: "Flash Trade",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1884285029485834241/CkkSyrQq_400x400.jpg",
      lastTweetId: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "JupiterExchange",
      displayName: "Jupiter Exchange",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1661738815890022410/F8y4vBky_400x400.jpg",
      lastTweetId: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "RaydiumProtocol",
      displayName: "Raydium Protocol",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1742621757230678016/_Av2hYEY_400x400.jpg",
      lastTweetId: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "jito_sol",
      displayName: "Jito",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1687112019563188224/mnbhxwox_400x400.png",
      lastTweetId: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "sanctumso",
      displayName: "Sanctum",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1890242588025974784/5PeY6P87_400x400.jpg",
      lastTweetId: null,
      userIds: generatedUsers.map((user) => user.id),
    },
  ];

  for (const account of xAccounts) {
    // ユーザー名による重複チェック
    const existingAccount = existingAccounts.find((a) => a.id === account.id);

    if (!existingAccount) {
      await db.insert(xAccountTable).values(account);
      console.log(`Xアカウント "${account.displayName}" (@${account.id}) を挿入しました`);
    } else {
      console.log(`Xアカウント "${account.displayName}" (@${account.id}) は既に存在します。スキップします。`);
    }
  }

  return xAccounts;
};

const seedNewsSites = async (generatedUsers: UserSelect[]) => {
  const newsSites: NewsSiteInsert[] = [
    {
      url: "https://www.jito.network/blog",
      title: "Jito Blog",
      userIds: generatedUsers.map((user) => user.id),
      lastScraped: null,
    },
    {
      url: "https://coinpost.jp",
      title: "CoinPost",
      userIds: generatedUsers.map((user) => user.id),
      lastScraped: null,
    },
    {
      url: "https://solana.com/news",
      title: "Solana News",
      userIds: generatedUsers.map((user) => user.id),
      lastScraped: null,
    },
  ];

  const existingSites = await db.select().from(newsSiteTable);

  for (const site of newsSites) {
    // ユーザー名による重複チェック
    const existingSite = existingSites.find((s) => s.url === site.url);

    if (!existingSite) {
      await db.insert(newsSiteTable).values(site);
      console.log(`ニュースサイト "${site.title}" (${site.url}) を挿入しました`);
    } else {
      console.log(`ニュースサイト "${site.title}" (${site.url}) は既に存在します。スキップします。`);
    }
  }

  return newsSites;
};

const seedUserTokenBalances = async (generatedUsers: UserSelect[]) => {
  try {
    console.log("ユーザートークン残高データを挿入中...");

    // すべてのトークンを取得
    const tokens = await db.select().from(tokensTable);

    // staking tokenを除外
    const nonStakingTokens = tokens.filter((token) => token.type !== "staking");

    // すでに存在するユーザートークン残高を確認
    const existingBalances = await db.select().from(userBalancesTable);

    const balances: UserBalanceInsert[] = [];

    // トークンごとのデフォルト残高を設定
    const defaultBalances: Record<string, number> = {
      SOL: 100, // 基本トークン
      USDC: 10000, // ステーブルコイン
      BONK: 100000, // ミームコイン
      $WIF: 20, // ミームコイン
      JUP: 200, // DEXトークン
      RAY: 200, // DEXトークン
      PYTH: 200, // オラクル
      JTO: 100, // ステーキング関連
      TRUMP: 20, // その他
      GRASS: 20, // その他
      INF: 20, // その他
    };

    // ユーザーごとのトークン残高を設定
    for (const user of generatedUsers) {
      for (const token of nonStakingTokens) {
        // トークンシンボルに基づいて残高を取得
        const amount = defaultBalances[token.symbol] || 0;

        // 残高が0より大きい場合のみ追加
        if (amount > 0) {
          balances.push({
            userId: user.id,
            tokenAddress: token.address,
            balance: amount.toString(),
          });
        }
      }
    }

    // 残高を挿入
    for (const balance of balances) {
      // 既存の残高をチェック
      const existingBalance = existingBalances.find(
        (b) => b.userId === balance.userId && b.tokenAddress === balance.tokenAddress,
      );

      if (!existingBalance) {
        await db.insert(userBalancesTable).values(balance);
        console.log(`ユーザーID ${balance.userId} のトークン残高 ${balance.balance} を挿入しました`);
      } else {
        console.log(`ユーザーID ${balance.userId} のトークン残高は既に存在します。スキップします。`);
      }
    }

    return balances;
  } catch (error) {
    console.error("ユーザートークン残高データの挿入中にエラーが発生しました:", error);
    throw error;
  }
};

/**
 * staking tokenのinterest rate（金利）を設定するシード関数
 */
const seedStakingTokenInterestRates = async () => {
  try {
    console.log("staking tokenのinterest rate（金利）データを挿入中...");

    // すべてのトークンを取得
    const tokens = await db.select().from(tokensTable);

    // stakingタイプのトークンのみをフィルタリング
    const stakingTokens = tokens.filter((token) => token.type === "staking");

    // 金利データ
    const interestRates = [
      { symbol: "INF", rate: 10.27 },
      { symbol: "jitoSOL", rate: 7.87 },
      { symbol: "jupSOL", rate: 8.48 },
    ];

    // すでに存在する金利データを確認
    const existingRates = await db.select().from(interestRatesTable);

    // 金利データを挿入
    for (const stakingToken of stakingTokens) {
      // 対応する金利データを検索
      const rateData = interestRates.find((data) => data.symbol === stakingToken.symbol);

      if (rateData) {
        // 既存のデータを確認（トークンアドレスとアクションタイプで一致するものを検索）
        const existingRate = existingRates.find(
          (rate) => rate.tokenAddress === stakingToken.address && rate.actionType === "liquid_staking",
        );

        const interestRateData: InterestRateInsert = {
          tokenAddress: stakingToken.address,
          actionType: "liquid_staking", // Liquid Stakingに関連する金利
          interestRate: rateData.rate,
          effectiveDate: new Date(),
        };

        if (!existingRate) {
          await db.insert(interestRatesTable).values(interestRateData);
          console.log(`トークン "${stakingToken.symbol}" の金利 ${rateData.rate}% を挿入しました`);
        } else {
          // 既存のデータを更新
          await db
            .update(interestRatesTable)
            .set({ interestRate: rateData.rate, effectiveDate: new Date() })
            .where(eq(interestRatesTable.tokenAddress, stakingToken.address));
          console.log(`トークン "${stakingToken.symbol}" の金利を ${rateData.rate}% に更新しました`);
        }
      } else {
        console.log(`警告: トークン "${stakingToken.symbol}" の金利データが見つかりません`);
      }
    }

    return interestRates;
  } catch (error) {
    console.error("staking tokenのinterest rate（金利）データの挿入中にエラーが発生しました:", error);
    throw error;
  }
};

/**
 * データベースにシードデータを挿入
 */
async function seed() {
  console.log("シードデータ挿入を開始します...");

  const generatedUsers = await seedUsers();

  // トークン挿入
  console.log("トークンデータを挿入中...");
  await seedTokens();

  // ユーザートークン残高挿入
  console.log("ユーザートークン残高データを挿入中...");
  await seedUserTokenBalances(generatedUsers);

  // staking tokenの金利データ挿入
  console.log("staking tokenの金利データを挿入中...");
  await seedStakingTokenInterestRates();

  // Xアカウント挿入
  console.log("Xアカウントデータを挿入中...");
  await seedXAccounts(generatedUsers);

  // ニュースサイト挿入
  console.log("ニュースサイトデータを挿入中...");
  await seedNewsSites(generatedUsers);

  console.log("シードデータの挿入が完了しました！");
}

// シード実行
seed()
  .catch((error) => {
    console.error("シード処理が失敗しました:", error);
    process.exit(1);
  })
  .finally(async () => {
    // データベース接続のクリーンアップはここで行う場合
    console.log("シード処理を終了します");
    process.exit(0);
  });

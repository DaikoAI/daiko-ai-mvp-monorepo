import { eq } from "drizzle-orm";
import { db } from ".";
import { setupInitialPortfolio } from "../utils/portfolio";
import { InterestRateInsert, interestRatesTable } from "./schema/interest_rates";
import { NewsSiteInsert, newsSiteTable } from "./schema/news_sites";
import { TokenInsert, tokensTable } from "./schema/tokens";
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
        address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
        symbol: "WIF",
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
        name: "Jito",
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
        address: "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux",
        symbol: "HNT",
        name: "Helium Network Token",
        decimals: 6,
        type: "normal",
        iconUrl: "https://shdw-drive.genesysgo.net/6tF2J46QN4NCNGnLkGz29g6Puf1bq19E2134V7fF7Jj1/hnt.png",
      },
      {
        address: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ",
        symbol: "W",
        name: "Wormhole",
        decimals: 6,
        type: "normal",
        iconUrl: "https://wormhole.com/token.png",
      },
      {
        address: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
        symbol: "MEW",
        name: "cat in a dogs world",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://dd.dexscreener.com/ds-data/tokens/solana/MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5.png?key=2d57a9",
      },
      {
        address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
        symbol: "POPCAT",
        name: "Popcat (SOL)",
        decimals: 9,
        type: "normal",
        iconUrl:
          "https://dd.dexscreener.com/ds-data/tokens/solana/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png?key=af7c36",
      },
      {
        address: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
        symbol: "ORCA",
        name: "Orca",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png",
      },
      {
        address: "ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq",
        symbol: "ZEUS",
        name: "Zeus Network",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://dd.dexscreener.com/ds-data/tokens/solana/ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq.png?key=68e8cb",
      },
      {
        address: "KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS",
        symbol: "KMNO",
        name: "Kamino",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://dd.dexscreener.com/ds-data/tokens/solana/KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS.png?key=8b4bd9",
      },
      {
        address: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
        symbol: "WBTC",
        name: "Wrapped Bitcoin (Portal)",
        decimals: 8,
        type: "normal",
        iconUrl:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png",
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
      {
        address: "bioJ9JTqW62MLz7UKHU69gtKhPpGi1BQhccj2kmSvUJ",
        symbol: "BIO",
        name: "BIO",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://dd.dexscreener.com/ds-data/tokens/solana/bioJ9JTqW62MLz7UKHU69gtKhPpGi1BQhccj2kmSvUJ.png?key=289685",
      },
      {
        address: "LAYER4xPpTCb3QL8S9u41EAhAX7mhBn8Q6xMTwY2Yzc",
        symbol: "LAYER",
        name: "Solayer",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://dd.dexscreener.com/ds-data/tokens/solana/LAYER4xPpTCb3QL8S9u41EAhAX7mhBn8Q6xMTwY2Yzc.png?key=2260ae",
      },
      {
        address: "14zP2ToQ79XWvc7FQpm4bRnp9d6Mp1rFfsUW3gpLcRX",
        symbol: "AIXBT",
        name: "aixbt by Virtuals (Wormhole)",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://dd.dexscreener.com/ds-data/tokens/base/0x4f9fd6be4a90f2620860d680c0d4d5fb53d1a825.png?key=6a3b50",
      },
      {
        address: "GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump",
        symbol: "ACT",
        name: "Act I : The AI Prophecy",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://dd.dexscreener.com/ds-data/tokens/solana/GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump.png?key=1aece6",
      },
      {
        address: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
        symbol: "Fartcoin",
        name: "Fartcoin",
        decimals: 6,
        type: "normal",
        iconUrl:
          "https://dd.dexscreener.com/ds-data/tokens/solana/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump.png?key=8180d2",
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
  } catch (error) {}
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

const seedUserTokenBalances = async (generatedUsers: UserSelect[]): Promise<void> => {
  try {
    console.log("ユーザートークン残高データを挿入中...");

    // ユーザーごとに setupInitialPortfolio を呼び出す
    for (const user of generatedUsers) {
      await setupInitialPortfolio(user.id);
      // setupInitialPortfolio内でログが出力されるため、ここでの個別ログは不要
    }

    console.log(`全ユーザー (${generatedUsers.length}人) の初期トークン残高設定が完了しました。`);
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

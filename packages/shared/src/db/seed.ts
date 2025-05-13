import { eq } from "drizzle-orm";
import { db } from ".";
import { initialTokens } from "../constants";
import { setupInitialPortfolio } from "../utils/portfolio";
import { InterestRateInsert, interestRatesTable } from "./schema/interest_rates";
import { NewsSiteInsert, newsSiteTable } from "./schema/news_sites";
import { ProposalInsert, proposalTable } from "./schema/proposals";
import { tokensTable } from "./schema/tokens";
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

    const existingTokens = await db.select().from(tokensTable);

    for (const token of initialTokens) {
      const existingToken = existingTokens.find((t) => t.address === token.address);

      if (!existingToken) {
        await db.insert(tokensTable).values(token);
        console.log(`トークン "${token.name}" (${token.symbol}) を挿入しました`);
      } else {
        console.log(`トークン "${token.name}" (${token.symbol}) は既に存在します。スキップします。`);
      }
    }

    return initialTokens;
  } catch (error) {}
};

const seedXAccounts = async (generatedUsers: UserSelect[]) => {
  // すでに存在するXアカウントを確認
  const existingAccounts = await db.select().from(xAccountTable);
  // Xアカウントデータ
  const xAccounts: XAccountInsert[] = [
    {
      id: "whalewatchalert",
      displayName: "Whale Watch by Moby",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1897776430341083140/aY2MwRYH_400x400.jpg",
      lastTweetUpdatedAt: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "mobyagent",
      displayName: "Moby Agent",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1897771159573110784/MyGL15Y0_400x400.jpg",
      lastTweetUpdatedAt: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "HOLLYAIAGENT",
      displayName: "HOLLY AI",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1884276107991736321/i0Kak51G_400x400.jpg",
      lastTweetUpdatedAt: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "WatcherGuru",
      displayName: "Watcher.Guru",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1641221212578754562/DfiC0KW2_400x400.png",
      lastTweetUpdatedAt: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "aixbt_agent",
      displayName: "aixbt",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1874758416658509824/UPaVddbm_400x400.jpg",
      lastTweetUpdatedAt: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "glassnode",
      displayName: "glassnode",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1587118531556130816/dLPGGpUC_400x400.jpg",
      lastTweetUpdatedAt: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "OnchainLens",
      displayName: "Onchain Lens",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1838018997025165313/MzbZggaZ_400x400.jpg",
      lastTweetUpdatedAt: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "Chyan",
      displayName: "Chyan | chyan.base.eth",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1741032931446198272/5DTzmIBX_400x400.jpg",
      lastTweetUpdatedAt: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "SOU_BTC",
      displayName: "SOU⚡️仮想通貨 / ビットコイン",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1765218233324597248/LRgSXGTP_400x400.png",
      lastTweetUpdatedAt: null,
      userIds: generatedUsers.map((user) => user.id),
    },
    {
      id: "SolanaFloor",
      displayName: "SolanaFloor",
      profileImageUrl: "https://pbs.twimg.com/profile_images/1836427519836217344/kQxl-LQo_400x400.png",
      lastTweetUpdatedAt: null,
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
 * proposalデータを挿入するシード関数
 */
const seedProposals = async (generatedUsers: UserSelect[]) => {
  try {
    console.log("提案データを挿入中...");

    const SIX_MONTHS_SECONDS = 1000 * 60 * 60 * 24 * 30 * 6;

    const staticProposals: Omit<ProposalInsert, "userId">[] = [
      {
        title: "Reduce 70% $RAY Exposure Due to Liquidity Shift to Pump Swap",
        summary: "Reduce 70% of your $RAY holdings due to liquidity shift to PumpSwap on March 20, 2025",
        reason: [
          "Top 12 wallets reduced $RAY holdings by 10% in the past 72 hours",
          "Pump.fun's switch to PumpSwap on March 20, 2025, reduced Raydium's token migration volume by an estimated 30%",
          "$RAY price has declined 5.2% since the PumpSwap announcement due to lower trading activity",
        ],
        sources: [
          { name: "Raydium Wallet Movement Tracker", url: "#" },
          { name: "Pump.fun Announcement", url: "#" },
          { name: "DEX Price Analysis", url: "#" },
        ],
        type: "risk",
        proposedBy: "Daiko AI",
        expiresAt: new Date(Date.now() + SIX_MONTHS_SECONDS - 1000 * 60 * 60 * 24 * 3),
        financialImpact: {
          currentValue: 1000,
          projectedValue: 948,
          percentChange: -5.2,
          timeFrame: "immediate",
          riskLevel: "high",
        },
        status: "active",
        contractCall: {
          type: "swap",
          description: "Sell 70% of RAY for USDC",
          params: {
            fromToken: { symbol: "RAY", address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R" },
            toToken: { symbol: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
            fromAmount: 0.7,
          },
        },
      },
      {
        title: "Reduce 70% $MELANIA Exposure Due to Major Exchange Inflow",
        summary: "Reduce 70% of your $MELANIA tokens to mitigate risk following major exchange inflow",
        reason: [
          "Known whale wallet 3Yz6aU...H8iWjJ transferred 2M $MELANIA to Binance",
          "Historically, similar movements from this wallet for this token preceded price drops of 25-30%",
          "Exchange order books show increasing sell-side pressure",
        ],
        sources: [
          { name: "Melania On-Chain Whale Tracker", url: "#" },
          { name: "Whale's Solscan Token Account", url: "#" },
          { name: "Nansen Wallet Profiler", url: "#" },
        ],
        type: "risk",
        proposedBy: "Daiko AI",
        expiresAt: new Date(Date.now() + SIX_MONTHS_SECONDS - 1000 * 60 * 60 * 24 * 2),
        financialImpact: {
          currentValue: 1200,
          projectedValue: 876,
          percentChange: -27,
          timeFrame: "short-term",
          riskLevel: "high",
        },
        status: "active",
        contractCall: {
          type: "swap",
          description: "Sell 70% of MELANIA for USDC",
          params: {
            fromToken: { symbol: "MELANIA", address: "FUAfBo2jgks6gB4Z4LfZkqSZgzNucisEHqnNebaRxM1P" },
            toToken: { symbol: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
            fromAmount: 0.7,
          },
        },
      },
      {
        title: "Reduce 60% $FARTCOIN Exposure: Critical Support at Risk with Weakening Buy-Side Liquidity",
        summary:
          "Reduce 60% of your $FARTCOIN exposure due to weakening buy-side liquidity and critical support at risk",
        reason: [
          "$FARTCOIN repeatedly testing major support at $1.21; multiple failed bounces observed",
          "On-chain liquidity analysis shows thinning buy orders below the current price",
          "Significant cluster of liquidation levels for long positions identified just below $1.21; a break could trigger cascading sell-offs",
          "Rapid increase in exchange deposits observed, indicating widespread panic selling is beginning",
        ],
        sources: [
          { name: "DEX Screener (Price & Volume Analysis)", url: "#" },
          { name: "Daiko On-Chain Liquidity Monitor", url: "#" },
          { name: "Project's Official Communication Channels", url: "#" },
          { name: "Exchange Deposit Tracker", url: "#" },
        ],
        type: "risk",
        proposedBy: "Daiko AI",
        expiresAt: new Date(Date.now() + SIX_MONTHS_SECONDS - 1000 * 60 * 60 * 24),
        financialImpact: {
          currentValue: 1.21,
          projectedValue: 0.484,
          percentChange: -60,
          timeFrame: "immediate",
          riskLevel: "high",
        },
        status: "active",
        contractCall: {
          type: "swap",
          description: "Sell 60% of FARTCOIN for USDC",
          params: {
            fromToken: { symbol: "Fartcoin", address: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump" },
            toToken: { symbol: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
            fromAmount: 0.6,
          },
        },
      },
      {
        title: "Stake 4 SOL in Jito's jitoSOL for Enhanced Yields",
        summary:
          "Earn 8.24% APY by converting your idle 4 SOL ($595.92) to jitoSOL, Jito's high-yield liquid staking token",
        reason: [
          "You have 4 SOL ($595.92) sitting idle in your wallet", // Updated value
          "jitoSOL offers one of the highest yields among Solana LSTs (8.24% current APY)",
          "Zero fees: 0% management fee, 0% validator commission, 0% stake deposit fee",
        ],
        sources: [
          { name: "Jito jitoSOL Documentation", url: "#" },
          { name: "Solana LST Comparison Analysis", url: "#" },
          { name: "jitoSOL Performance Metrics", url: "#" },
        ],
        type: "stake",
        proposedBy: "Daiko AI",
        expiresAt: new Date(Date.now() + SIX_MONTHS_SECONDS),
        financialImpact: {
          currentValue: 595.92, // Updated value (4 * 148.98)
          projectedValue: 645.03, // Updated projected value (595.92 * 1.0824)
          percentChange: 8.24,
          timeFrame: "1 year",
          riskLevel: "low",
        },
        status: "active",
        contractCall: {
          type: "stake",
          description: "Stake SOL to jitoSOL for higher yields",
          params: {
            fromToken: {
              symbol: "SOL",
              address: "So11111111111111111111111111111111111111112",
            },
            toToken: {
              symbol: "jitoSOL",
              address: "jitoSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
            },
            fromAmount: 4, // Corrected amount
          },
        },
      },
    ];

    // すでに存在する提案を確認
    const existingProposals = await db.select().from(proposalTable);

    for (const user of generatedUsers) {
      for (const staticProposal of staticProposals) {
        const proposal: ProposalInsert = {
          ...staticProposal,
          userId: user.id,
        };

        // タイトルとユーザーIDによる重複チェック
        const existingProposal = existingProposals.find((p) => p.title === proposal.title && p.userId === user.id);

        if (!existingProposal) {
          await db.insert(proposalTable).values(proposal);
          console.log(`ユーザー "${user.name}" の提案 "${proposal.title}" を挿入しました`);
        } else {
          console.log(`ユーザー "${user.name}" の提案 "${proposal.title}" は既に存在します。スキップします。`);
        }
      }
    }
  } catch (error) {
    console.error("提案データの挿入中にエラーが発生しました:", error);
    throw error;
  }
};

/**
 * データベースにシードデータを挿入
 */
async function seed() {
  console.log("シードデータ挿入を開始します...");

  // const generatedUsers = await seedUsers();
  const users = await db.select().from(usersTable); // usersをここで取得

  // // トークン挿入
  // console.log("トークンデータを挿入中...");
  // await seedTokens();

  // // ユーザートークン残高挿入
  // console.log("ユーザートークン残高データを挿入中...");
  // await seedUserTokenBalances(generatedUsers);

  // // staking tokenの金利データ挿入
  // console.log("staking tokenの金利データを挿入中...");
  // await seedStakingTokenInterestRates();

  // // Xアカウント挿入
  // console.log("Xアカウントデータを挿入中...");
  // const users = await db.select().from(usersTable); // seedProposalsに渡すためにここで宣言
  // await seedXAccounts(users);

  // // ニュースサイト挿入
  // console.log("ニュースサイトデータを挿入中...");
  // await seedNewsSites(generatedUsers);

  // 提案データ挿入 (New)
  console.log("提案データを挿入中...");
  await seedProposals(users); // usersを引数として渡す

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

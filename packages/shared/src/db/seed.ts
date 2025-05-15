import { eq } from "drizzle-orm";
import { db } from ".";
import { initialTokens, staticProposals } from "../constants";
import { logger } from "../utils";
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
      { symbol: "JitoSOL", rate: 7.87 },
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
    logger.debug("seedProposals", "Preparing proposals for insertion...");

    // 1. 挿入候補のプロポーザルリストを作成
    const allPotentialProposals: ProposalInsert[] = generatedUsers.flatMap((user) =>
      staticProposals.map((staticProposal) => ({
        ...staticProposal,
        userId: user.id,
      })),
    );

    if (allPotentialProposals.length === 0) {
      logger.info("seedProposals", "No potential proposals to insert.");
      return;
    }

    // 2. 既存のプロポーザルをすべて取得（タイトルとユーザーIDで判断するため）
    // 大量データの場合、この部分の最適化も考慮が必要ですが、現状のデータ量では許容範囲とします。
    const existingProposals = await db
      .select({ title: proposalTable.title, userId: proposalTable.userId })
      .from(proposalTable);
    const existingProposalSet = new Set(existingProposals.map((p) => `${p.title}-${p.userId}`));

    // 3. 挿入すべきプロポーザルをフィルタリング
    const proposalsToInsert = allPotentialProposals.filter(
      (proposal) => !existingProposalSet.has(`${proposal.title}-${proposal.userId}`),
    );

    if (proposalsToInsert.length === 0) {
      logger.info("seedProposals", "All static proposals already exist for the generated users.");
      return;
    }

    logger.info("seedProposals", `Attempting to insert ${proposalsToInsert.length} new proposals.`);

    // 4. トランザクション内でバルクインサート
    await db.transaction(async (tx) => {
      // drizzle-ormのinsertはvaluesに配列を渡すことでバルクインサートをサポートします
      await tx.insert(proposalTable).values(proposalsToInsert);
    });

    logger.info("seedProposals", `${proposalsToInsert.length} proposals inserted successfully.`);
    proposalsToInsert.forEach((p) =>
      logger.debug(
        "seedProposals",
        `Inserted: User "${generatedUsers.find((u) => u.id === p.userId)?.name}" proposal "${p.title}"`,
      ),
    );
  } catch (error) {
    logger.error("seedProposals", "Error inserting static proposals:", error);
    throw error;
  }
};

/**
 * データベースにシードデータを挿入
 */
async function seed() {
  logger.debug("seed", "Starting seeding...");

  // const generatedUsers = await seedUsers();
  const users = await db.select().from(usersTable); // usersをここで取得

  // // トークン挿入
  // console.log("トークンデータを挿入中...");
  // await seedTokens();

  // // ユーザートークン残高挿入
  // console.log("ユーザートークン残高データを挿入中...");
  // await seedUserTokenBalances(users);

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
  logger.debug("seed", "Inserting static proposals...");
  await seedProposals(users); // usersを引数として渡す
}

// シード実行
seed()
  .catch((error) => {
    logger.error("seed", "Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    // データベース接続のクリーンアップはここで行う場合
    logger.debug("seed", "Seeding completed!");
    process.exit(0);
  });

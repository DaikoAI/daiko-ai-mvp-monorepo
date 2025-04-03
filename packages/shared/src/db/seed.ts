import { db } from "./connection";
import { NewsSiteInsert, newsSiteTable } from "./schema/newsSites";
import { UserInsert, UserSelect, usersTable } from "./schema/users";
import { XAccountInsert, xAccountTable } from "./schema/xAccounts";

const seedUsers = async () => {
  try {
    // ユーザーデータ
    const users: UserInsert[] = [
      {
        name: "山田太郎",
        age: 30,
        email: "yamada@example.com",
      },
      {
        name: "佐藤花子",
        age: 25,
        email: "sato@example.com",
      },
      {
        name: "鈴木一郎",
        age: 35,
        email: "suzuki@example.com",
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

/**
 * データベースにシードデータを挿入
 */
async function seed() {
  console.log("シードデータ挿入を開始します...");

  const generatedUsers = await seedUsers();

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

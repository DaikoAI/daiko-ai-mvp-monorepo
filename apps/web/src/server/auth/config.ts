import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Keypair } from "@solana/web3.js";
import { sql } from "drizzle-orm";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { accountsTable, db, sessionsTable, usersTable, verificationTokensTable } from "@daiko-ai/shared";
import { setupInitialPortfolio } from "@daiko-ai/shared/src/utils/portfolio";
import { env } from "process";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      walletAddress: string;
      email: string;
      name: string;
      image: string;
      totalAssetUsd: number;
      cryptoInvestmentUsd: number;
      tradeStyle: "day" | "swing" | "long";
      age: number;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }
}

/**
 * Solanaのウォレットアドレスを生成する関数
 * @returns ランダムに生成されたSolanaウォレットアドレス
 */
function generateSolanaWalletAddress(): string {
  // 新しいKeypairを生成
  const keypair = Keypair.generate();
  // 公開鍵（ウォレットアドレス）を文字列として返す
  return keypair.publicKey.toString();
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable,
  }),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  events: {
    // ユーザー作成時のイベントハンドラ - ユーザーがDBに作成された直後に1回だけ実行される
    createUser: async ({ user }) => {
      console.log("createUser event triggered for user:", user.id);
      if (user.id) {
        try {
          // Solanaウォレットアドレスを生成
          const walletAddress = generateSolanaWalletAddress();

          // ユーザー情報をウォレットアドレスで更新
          await db
            .update(usersTable)
            .set({ walletAddress })
            .where(sql`${usersTable.id} = ${user.id}`);

          console.log(`Generated Solana wallet address: ${walletAddress} for user ${user.id}`);

          // 共通の初期ポートフォリオ設定関数を使用
          // 新規ユーザーには基本的なトークンのみを設定
          await setupInitialPortfolio(user.id);
          console.log(`Initialized portfolio for user ${user.id}`);
        } catch (error) {
          console.error(`Error during createUser event for user ${user.id}:`, error);
        }
      }
    },
  },
} satisfies NextAuthConfig;

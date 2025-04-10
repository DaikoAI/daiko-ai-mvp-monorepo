import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/env";
import { generateSolanaWalletAddress } from "@/utils";
import { accountsTable, db, sessionsTable, usersTable, verificationTokensTable } from "@daiko-ai/shared";
import { setupInitialPortfolio } from "@daiko-ai/shared/src/utils/portfolio";
import { sql } from "drizzle-orm";

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
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable,
  }),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
  events: {
    // ユーザー作成時のイベントハンドラ - ユーザーがDBに作成された直後に1回だけ実行される
    createUser: async ({ user }) => {
      if (!user.id) return;
      console.log("createUser event triggered for user:", user.id);
      try {
        await Promise.all([
          await db
            .update(usersTable)
            .set({ walletAddress: generateSolanaWalletAddress() })
            .where(sql`${usersTable.id} = ${user.id}`),
          setupInitialPortfolio(user.id),
        ]);
        console.log(`Initialized portfolio for user ${user.id}`);
      } catch (error) {
        console.error(`Error during createUser event for user ${user.id}:`, error);
      }
    },
  },
  debug: true,
  logger: {
    error: (code, ...rest) => {
      console.error(code, ...rest);
    },
    debug: (code, ...rest) => {
      console.debug(code, ...rest);
    },
  },
} satisfies NextAuthConfig;

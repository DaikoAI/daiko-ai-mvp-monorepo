import { generateSolanaWalletAddress } from "@/utils";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { accountsTable, db, sessionsTable, usersTable, verificationTokensTable } from "@daiko-ai/shared";
import { setupInitialPortfolio } from "@daiko-ai/shared/src/utils/portfolio";
import { sql } from "drizzle-orm";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// import TwitterProvider from "next-auth/providers/twitter";
// import PasskeyProvider from "next-auth/providers/passkey";

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
  providers: [GoogleProvider],
  adapter: DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable,
  }),
  callbacks: {
    // session: ({ session, user }) => ({
    //   ...session,
    //   user: {
    //     ...session.user,
    //     id: user.id,
    //   },
    // }),
  },
  events: {
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
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;

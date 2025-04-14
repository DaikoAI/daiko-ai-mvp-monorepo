import { generateSolanaWalletAddress } from "@/utils";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { accountsTable, db, sessionsTable, usersTable, verificationTokensTable } from "@daiko-ai/shared";
import { setupInitialPortfolio } from "@daiko-ai/shared/src/utils/portfolio";
import { sql } from "drizzle-orm";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
      notificationEnabled: boolean;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  providers: [GoogleProvider],
  adapter: DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable,
  }),
  callbacks: {
    session: ({ session, user }) => {
      return {
        ...session,
        user: { ...session.user, id: user.id },
      };
    },
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
} satisfies NextAuthConfig;

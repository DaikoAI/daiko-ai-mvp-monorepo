import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { accountsTable, db, sessionsTable, usersTable, verificationTokensTable } from "@daiko-ai/shared";
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
      console.log("=== Session Callback Debug ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Session User ID:", session.user?.id);

      return {
        ...session,
        user: { ...session.user, id: user.id },
      };
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("=== Sign In Event Debug ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("User ID:", user.id);
      console.log("Is New User:", isNewUser);
      console.log("Provider:", account?.provider);
    },
    async session({ session }) {
      console.log("=== Session Debug ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Session User ID:", session.user?.id);
    },
    createUser: async ({ user }) => {
      console.log("createUser event triggered for user:", user.id);
      console.log("=== Create User Debug ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("New User ID:", user.id);
      // if (!user.id) return;
      // console.log("createUser event triggered for user:", user.id);
      // try {
      //   await Promise.all([
      //     await db
      //       .update(usersTable)
      //       .set({ walletAddress: generateSolanaWalletAddress() })
      //       .where(sql`${usersTable.id} = ${user.id}`),
      //     setupInitialPortfolio(user.id),
      //   ]);
      //   console.log(`Initialized portfolio for user ${user.id}`);
      // } catch (error) {
      //   console.error(`Error during createUser event for user ${user.id}:`, error);
      // }
    },
  },
  debug: true,
} satisfies NextAuthConfig;

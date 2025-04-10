import { auth } from "@/server/auth";
import type { NextPage } from "next";
import { redirect } from "next/navigation";
import { UserSettings } from "./components/user-settings";

const ProfilePage: NextPage = async () => {
  const session = await auth();
  if (!session) {
    redirect("/onboarding");
  }

  return (
    <main className="safe-main-container px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <UserSettings
        user={session.user}
        initialSettings={{
          tradeStyle: session.user.tradeStyle,
          totalAssetUsd: session.user.totalAssetUsd,
          cryptoInvestmentUsd: session.user.cryptoInvestmentUsd,
          age: session.user.age,
        }}
      />
    </main>
  );
};

export default ProfilePage;

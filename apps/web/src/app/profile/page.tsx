import { NextPage } from "next";
import { UserSettings } from "./components/user-settings";

const ProfilePage: NextPage = () => {
  return (
    <main className="safe-main-container px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <UserSettings />
    </main>
  );
};

export default ProfilePage;

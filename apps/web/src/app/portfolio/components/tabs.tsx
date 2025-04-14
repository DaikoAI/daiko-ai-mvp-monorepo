"use client";

import { type ReactNode, useState } from "react";

type TabsProps = {
  tokensTab: ReactNode;
  collectiblesTab: ReactNode;
};

export const Tabs: React.FC<TabsProps> = ({ tokensTab, collectiblesTab }) => {
  const [activeTab, setActiveTab] = useState<"tokens" | "collectibles">("tokens");

  return (
    <section>
      <div className="flex mb-4">
        <div className="flex justify-center gap-8 w-full">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`px-4 py-2 font-medium text-base transition-colors duration-200 ${
              activeTab === "tokens" ? "bg-white/12 text-white rounded-lg" : "text-white/50"
            }`}
          >
            Tokens
          </button>
          <button
            onClick={() => setActiveTab("collectibles")}
            className={`px-4 py-2 font-medium text-base transition-colors duration-200 ${
              activeTab === "collectibles" ? "bg-white/12 text-white rounded-lg" : "text-white/50"
            }`}
          >
            Collectibles
          </button>
        </div>
      </div>

      <div className="mt-2">{activeTab === "tokens" ? tokensTab : collectiblesTab}</div>
    </section>
  );
};

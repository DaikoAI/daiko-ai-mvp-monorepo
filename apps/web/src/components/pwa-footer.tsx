"use client";

import { GlobalFooter } from "@/components/global-footer";
// import { isPWA } from "@/utils/pwa";
// import { useEffect } from "react";
import { usePathname } from "next/navigation";

const fullscreenPages = ["/onboarding", "/", "/privacy", "/terms"];

export const PwaFooter: React.FC = () => {
  // const [mounted, setMounted] = useState(false);
  // const [isPwaMode, setIsPwaMode] = useState(false);
  const pathname = usePathname();

  // パスが `/chat/` で始まるかどうかをチェック
  const isChatDetailPage = pathname.startsWith("/chat/");

  // マウント前や非PWA環境、または指定されたページやチャット詳細ページでは何も表示しない
  if (fullscreenPages.includes(pathname) || isChatDetailPage) {
    return null;
  }

  // PWA環境の場合のみグローバルフッターを表示
  return <GlobalFooter />;
};

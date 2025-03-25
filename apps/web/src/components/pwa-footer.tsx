"use client";

import { GlobalFooter } from "@/components/global-footer";
// import { isPWA } from "@/utils/pwa";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const fullscreenPages = ["/onboarding", "/", "/privacy", "/terms"];

export const PwaFooter: React.FC = () => {
  // const [mounted, setMounted] = useState(false);
  // const [isPwaMode, setIsPwaMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // setIsPwaMode(isPWA());
  }, []);

  // マウント前や非PWA環境では何も表示しない
  if (fullscreenPages.includes(pathname)) {
    return null;
  }

  // PWA環境の場合のみグローバルフッターを表示
  return <GlobalFooter />;
};

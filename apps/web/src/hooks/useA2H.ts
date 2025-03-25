"use client";

// NOTE: written by @kodai3 in https://github.com/kodai3/react-use-a2hs/blob/main/src/useA2HS.ts
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface UseA2HSOptions {
  onAccepted?: () => void;
  onDismissed?: () => void;
}

/**
 * prompt A2HS if available.
 * Only Chrome and Edge is supported. (https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
 */
export const useA2HS = (options?: UseA2HSOptions) => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      // イベントを保存
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const promptToInstall = async (): Promise<boolean> => {
    if (!promptEvent) {
      throw new Error("No install prompt available");
    }

    // インストールプロンプトを表示
    promptEvent.prompt();

    // ユーザーの選択を待機
    const choiceResult = await promptEvent.userChoice;

    // イベントを消費したのでnullに設定
    setPromptEvent(null);

    // 選択結果に応じてコールバックを呼び出す
    if (choiceResult.outcome === "accepted") {
      if (options?.onAccepted) options.onAccepted();
      return true;
    } else {
      if (options?.onDismissed) options.onDismissed();
      return false;
    }
  };

  return { promptEvent, promptToInstall };
};

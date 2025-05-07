"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect } from "react";
import type { OnboardingState, OnboardingStep, UserProfile } from "@/types/onboarding";

const defaultOnboardingState: OnboardingState = {
  walletConnected: false,
  notificationEnabled: false,
  currentStep: "welcome",
  isComplete: false,
};

interface OnboardingContextType {
  state: OnboardingState;
  setCurrentStep: (step: OnboardingStep) => void;
  setWalletConnected: (connected: boolean) => void;
  setNotificationEnabled: (enabled: boolean) => void;
  setUserProfile: (profile: UserProfile) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>(() => {
    // ローカルストレージから状態を復元
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("onboardingState");
      if (saved) {
        try {
          return JSON.parse(saved) as OnboardingState;
        } catch (e) {
          // 解析エラーの場合はデフォルト値を使用
          console.error("Failed to parse onboarding state:", e);
        }
      }
    }
    return defaultOnboardingState;
  });

  // 状態変更時にローカルストレージに保存
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboardingState", JSON.stringify(state));
    }
  }, [state]);

  const setCurrentStep = (step: OnboardingStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  };

  const setWalletConnected = (connected: boolean) => {
    setState((prev) => ({ ...prev, walletConnected: connected }));
  };

  const setNotificationEnabled = (enabled: boolean) => {
    setState((prev) => ({ ...prev, notificationEnabled: enabled }));
  };

  const setUserProfile = (profile: UserProfile) => {
    setState((prev) => ({ ...prev, userProfile: { ...prev.userProfile, ...profile } }));
  };

  const completeOnboarding = () => {
    setState((prev) => ({ ...prev, isComplete: true }));
  };

  const resetOnboarding = () => {
    setState(defaultOnboardingState);
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        setCurrentStep,
        setWalletConnected,
        setNotificationEnabled,
        setUserProfile,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

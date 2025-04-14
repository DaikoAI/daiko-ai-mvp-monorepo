export interface OnboardingState {
  walletConnected: boolean;
  notificationEnabled: boolean;
  userProfile?: UserProfile;
  currentStep: OnboardingStep;
  isComplete: boolean;
}

export type OnboardingStep = "welcome" | "wallet" | "notification" | "profile" | "complete";

export type TradeStyle = "day" | "swing" | "long";

export interface UserProfile {
  age?: number;
  tradeStyle?: TradeStyle;
  totalAssetUsd?: number;
  cryptoInvestmentUsd?: number;
}

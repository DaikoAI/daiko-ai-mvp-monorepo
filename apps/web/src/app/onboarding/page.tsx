import type { NextPage } from "next";
import { OnboardingProvider } from "@/lib/onboarding-context";
import { OnboardingFlow } from "./components/onboarding-flow";

const OnboardingPage: NextPage = () => {
  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
};

export default OnboardingPage;

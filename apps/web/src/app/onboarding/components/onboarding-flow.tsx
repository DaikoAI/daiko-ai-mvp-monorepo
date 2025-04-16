"use client";

import { Progress } from "@/components/ui/progress";
import { useOnboarding } from "@/lib/onboarding-context";
import { isPWA } from "@/utils/pwa";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthStep } from "./auth-step";
import { CompleteStep } from "./complete-step";
import { NotificationStep } from "./notification-step";
import { ProfileStep } from "./profile-step";
import { WelcomeStep } from "./welcome-step";

export const OnboardingFlow: React.FC = () => {
  const { state, setCurrentStep } = useOnboarding();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();

  // Initialize after client-side mounting
  useEffect(() => {
    setMounted(true);

    // Skip onboarding if user has completed notification setup
    if (session?.user?.notificationEnabled) {
      router.replace("/proposals");
      return;
    }

    // Skip welcome step if running as PWA and on initial step
    if (isPWA() && state.currentStep === "welcome") {
      setCurrentStep("wallet");
    }
  }, [state.currentStep, setCurrentStep, session, router]);

  // Redirect to main app if onboarding is complete
  useEffect(() => {
    if (state.isComplete && state.currentStep === "complete") {
      // Wait briefly before redirecting (to show completion screen)
      const timer = setTimeout(() => {
        // alphaテストモードならポートフォリオページへ、そうでなければプロポーザルページへ
        router.replace("/proposals");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.isComplete, state.currentStep, router]);

  // Return null before mounting to ensure server-side rendering matches client state
  if (!mounted) return null;

  // Calculate progress based on current step
  const getProgress = () => {
    const steps: Record<string, number> = {
      welcome: 0,
      wallet: 25,
      notification: 50,
      profile: 75,
      complete: 100,
    };

    return steps[state.currentStep] || 0;
  };

  // Current progress
  const progress = getProgress();

  // Render component based on current step
  const renderStep = () => {
    switch (state.currentStep) {
      case "welcome":
        return <WelcomeStep />;
      case "wallet":
        // alphaテストモードならAuthStep、そうでなければWalletStep
        return <AuthStep />;
      case "notification":
        return <NotificationStep />;
      case "profile":
        return <ProfileStep />;
      case "complete":
        return <CompleteStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <main className="min-h-screen flex flex-col py-8 px-4">
      <div className="w-full max-w-md mx-auto mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Start</span>
          <span>Complete</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 flex items-center justify-center"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

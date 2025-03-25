"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/lib/onboarding-context";

export const WelcomeStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();

  const handleContinue = () => {
    // Proceed to the next step
    setCurrentStep("wallet");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to DAIKO!</CardTitle>
        <CardDescription>Connecting investors with opportunities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-primary"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-medium">Discover Optimal Investments</h3>
          <p className="text-sm text-muted-foreground">
            DAIKO helps you find the perfect investment opportunities tailored to your needs. Start simply and access
            anytime.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleContinue} className="w-full">
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};

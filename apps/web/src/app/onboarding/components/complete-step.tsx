"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/lib/onboarding-context";
import { useRouter } from "next/navigation";

export const CompleteStep: React.FC = () => {
  const router = useRouter();
  const { state } = useOnboarding();

  const handleGetStarted = () => {
    // Redirect to main app page
    router.push("/proposals");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">All Set!</CardTitle>
        <CardDescription>Start your investment journey with DAIKO</CardDescription>
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-medium">Configured Features</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            {state.walletConnected && <li>✓ Wallet connected</li>}
            {state.notificationEnabled && <li>✓ Notifications enabled</li>}
            {state.userProfile && <li>✓ Investment profile set up</li>}
          </ul>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-sm">
          <p className="font-medium">Next Step:</p>
          <p>Check out the optimal investment proposal and start building your investment portfolio.</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGetStarted} className="w-full">
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
};

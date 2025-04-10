"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/lib/onboarding-context";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/webauthn";
import { useEffect } from "react";
export const AuthStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      setCurrentStep("notification");
    }
  }, [status, session, setCurrentStep]);

  // Skip handler for alpha test users
  const handleSkip = () => {
    setCurrentStep("notification");
  };

  const handleSignIn = async () => {
    await signIn("passkey", {
      redirectTo: "/onboarding",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Connect Account</CardTitle>
        <CardDescription>Sign in to your alpha test account to get started</CardDescription>
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
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-medium">Welcome to Alpha Test</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Virtual trading environment</li>
            <li>• Common initial portfolio for all users</li>
            <li>• 2-week competition format</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <Button className="w-full text-lg font-bold" onClick={handleSignIn}>
          Sign in with Passkey
        </Button>
        {process.env.NODE_ENV === "development" && (
          <Button variant="outline" className="w-full" onClick={handleSkip}>
            Skip for Development
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

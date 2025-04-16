"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/use-push-notifications"; // Import the custom hook
import { useOnboarding } from "@/lib/onboarding-context";
import { useEffect } from "react";

export const NotificationStep: React.FC = () => {
  const { state, setNotificationEnabled, setCurrentStep } = useOnboarding();

  // Use the custom hook
  const {
    isSupported,
    permission,
    subscribe,
    isLoading,
    error,
    subscription, // Get the current subscription state
  } = usePushNotifications();

  // Update onboarding context based on hook state
  useEffect(() => {
    // If a subscription exists (either initially or after subscribing)
    // and notifications weren't already marked as enabled in context,
    // update the context.
    if (subscription && !state.notificationEnabled) {
      setNotificationEnabled(true);
    }

    if (state.notificationEnabled) {
      setCurrentStep("profile");
    }
  }, [subscription, setNotificationEnabled, state.notificationEnabled, setCurrentStep]);

  // Determine the button text and disabled state
  const isNotificationAllowed = permission === "granted";
  const buttonDisabled =
    !isSupported || isLoading || (isNotificationAllowed && !!subscription) || permission === "denied";

  let buttonText = "Enable Notifications";
  if (!isSupported) {
    buttonText = "Notifications Not Supported";
  } else if (isLoading) {
    buttonText = "Enabling...";
  } else if (permission === "denied") {
    buttonText = "Permission Denied";
  } else if (isNotificationAllowed && !!subscription) {
    buttonText = "Notifications Enabled";
  }

  // JSX - simplified using hook state
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Enable Notifications</CardTitle>
        <CardDescription>
          {permission === "denied"
            ? "Enable notifications in browser settings to proceed."
            : "Stay updated with important information"}
        </CardDescription>
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
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-medium">Benefits of Notifications</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Market price movement alerts</li>
            <li>• Investment opportunity updates</li>
            <li>• Important news and updates</li>
          </ul>
        </div>
        {/* Display hook error if any */}
        {error && <p className="text-sm text-center text-destructive">Error: {error}</p>}
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <Button
          onClick={subscribe} // Call the hook's subscribe function
          className="w-full"
          disabled={buttonDisabled}
        >
          {buttonText}
        </Button>
        {process.env.NODE_ENV === "development" && (
          <Button variant="outline" className="w-full" onClick={() => setCurrentStep("profile")}>
            Skip for Development
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

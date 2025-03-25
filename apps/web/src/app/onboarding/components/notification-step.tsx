"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/lib/onboarding-context";
import { useState } from "react";
import { toast } from "sonner";

export const NotificationStep: React.FC = () => {
  const { state, setNotificationEnabled, setCurrentStep } = useOnboarding();
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);

    try {
      // Request push notification permission
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          setNotificationEnabled(true);
          toast.success("Notifications enabled successfully");
        } else {
          toast.error("Notification permission denied");
        }
      } else {
        toast.error("Your browser does not support notifications");
      }

      // Proceed to next step
      setCurrentStep("profile");
    } catch (error) {
      console.error("Notification permission error:", error);
      toast.error("Error enabling notifications");
    } finally {
      setIsEnabling(false);
    }
  };

  // Skip handler
  const handleSkip = () => {
    setCurrentStep("profile");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Enable Notifications</CardTitle>
        <CardDescription>Stay updated with important information</CardDescription>
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
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <Button onClick={handleEnable} className="w-full" disabled={isEnabling || state.notificationEnabled}>
          {isEnabling ? "Enabling..." : state.notificationEnabled ? "Notifications Enabled" : "Enable Notifications"}
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="w-full">
          Later
        </Button>
      </CardFooter>
    </Card>
  );
};

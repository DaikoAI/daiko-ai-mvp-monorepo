"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOnboarding } from "@/lib/onboarding-context";
import { api } from "@/trpc/react";
import type { TradeStyle } from "@/types/onboarding";
import { useState } from "react";
import { toast } from "sonner";

export const ProfileStep: React.FC = () => {
  const { setCurrentStep, completeOnboarding } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutate: updateUserSettings } = api.users.updateUserSettings.useMutation();
  const [formData, setFormData] = useState({
    age: "",
    tradeStyle: "swing" as TradeStyle,
    totalAssetUsd: "",
    cryptoInvestmentUsd: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: TradeStyle) => {
    setFormData((prev) => ({ ...prev, tradeStyle: value }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    try {
      // Convert to numbers and validate trade style
      const profile = {
        age: formData.age ? parseInt(formData.age) : undefined,
        tradeStyle: formData.tradeStyle,
        totalAssetUsd: formData.totalAssetUsd ? parseInt(formData.totalAssetUsd) : undefined,
        cryptoInvestmentUsd: formData.cryptoInvestmentUsd ? parseInt(formData.cryptoInvestmentUsd) : undefined,
      };

      // Save to database
      updateUserSettings(
        {
          age: profile.age?.toString(),
          tradeStyle: profile.tradeStyle,
          totalAssetUsd: profile.totalAssetUsd?.toString(),
          cryptoInvestmentUsd: profile.cryptoInvestmentUsd?.toString(),
        },
        {
          onSuccess: () => {
            // Complete onboarding
            completeOnboarding();
            setCurrentStep("complete");
            toast.success("Profile saved successfully");
            setIsSubmitting(false);
          },
          onError: (error: any) => {
            console.error("Profile save error:", error);
            toast.error("An error occurred while saving your profile");
            setIsSubmitting(false);
          },
        },
      );
    } catch (error) {
      console.error("Profile save error:", error);
      toast.error("An error occurred while saving your profile");
      setIsSubmitting(false);
    }
  };

  // Skip handling
  const handleSkip = () => {
    completeOnboarding();
    setCurrentStep("complete");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Investment Profile</CardTitle>
        <CardDescription>Enter your information for better investment suggestions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="age">Age</Label>
          <Input id="age" name="age" type="number" placeholder="18" value={formData.age} onChange={handleInputChange} />
        </div>

        <div className="space-y-3">
          <Label>Trading Style</Label>
          <RadioGroup value={formData.tradeStyle} onValueChange={handleRadioChange as (value: string) => void}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="long" id="long" />
              <Label htmlFor="long">Long-term Holding (Conservative)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="swing" id="swing" />
              <Label htmlFor="swing">Swing Trading (Moderate)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="day" id="day" />
              <Label htmlFor="day">Day Trading (Aggressive)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label htmlFor="totalAssetUsd">Total Assets (USD)</Label>
          <Input
            id="totalAssetUsd"
            name="totalAssetUsd"
            type="number"
            placeholder="e.g. 10000"
            value={formData.totalAssetUsd}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="cryptoInvestmentUsd">Crypto Investment (USD)</Label>
          <Input
            id="cryptoInvestmentUsd"
            name="cryptoInvestmentUsd"
            type="number"
            placeholder="e.g. 1000"
            value={formData.cryptoInvestmentUsd}
            onChange={handleInputChange}
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save and Continue"}
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="w-full">
          Skip
        </Button>
      </CardFooter>
    </Card>
  );
};

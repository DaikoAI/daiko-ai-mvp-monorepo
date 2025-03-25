"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOnboarding } from "@/lib/onboarding-context";
import { TradeStyle } from "@/types/onboarding";
import { useState } from "react";
import { toast } from "sonner";

export const ProfileStep: React.FC = () => {
  const { setUserProfile, setCurrentStep, completeOnboarding } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    tradeStyle: "moderate" as TradeStyle,
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
      // Convert to numbers
      const profile = {
        age: formData.age ? parseInt(formData.age) : undefined,
        tradeStyle: formData.tradeStyle,
        totalAssetUsd: formData.totalAssetUsd ? parseFloat(formData.totalAssetUsd) : undefined,
        cryptoInvestmentUsd: formData.cryptoInvestmentUsd ? parseFloat(formData.cryptoInvestmentUsd) : undefined,
      };

      // Save profile
      setUserProfile(profile);

      // Complete onboarding
      completeOnboarding();
      setCurrentStep("complete");
      toast.success("Profile saved successfully");
    } catch (error) {
      console.error("Profile save error:", error);
      toast.error("An error occurred while saving your profile");
    } finally {
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
              <RadioGroupItem value="conservative" id="conservative" />
              <Label htmlFor="conservative">Conservative (Low Risk)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="moderate" id="moderate" />
              <Label htmlFor="moderate">Moderate (Medium Risk)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="aggressive" id="aggressive" />
              <Label htmlFor="aggressive">Aggressive (High Risk)</Label>
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

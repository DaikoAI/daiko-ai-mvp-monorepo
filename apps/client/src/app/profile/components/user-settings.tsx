"use client";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useWallet } from "@solana/wallet-adapter-react";
import { Pencil, Twitter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
export const UserSettings: React.FC = () => {
  const [riskTolerance, setRiskTolerance] = useState("medium");
  const [tradingStyle, setTradingStyle] = useState("swing");
  const [stakingEnabled, setStakingEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [birthday, setBirthday] = useState("1990-01-01");
  const [totalAssets, setTotalAssets] = useState("250000");
  const [cryptoInvestment, setCryptoInvestment] = useState("35000");
  const [isConnectingTwitter, setIsConnectingTwitter] = useState(false);
  const { publicKey } = useWallet();

  const walletAddress = publicKey?.toBase58() ?? "86oHY5tUBn4gqHSQAZJSUX6MU7WJVpg8bn8MZ4jKEb63";
  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  const handleSavePreferences = async () => {
    setIsSaving(true);

    // Simulate saving
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Preferences saved", {
      description: "Your investment preferences have been updated successfully.",
    });

    setIsSaving(false);
  };

  const handleConnectTwitter = async () => {
    setIsConnectingTwitter(true);

    // Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("Twitter connected", {
      description: "Your Twitter account has been successfully connected.",
    });

    setIsConnectingTwitter(false);
  };

  return (
    <div className="space-y-6">
      <Card glass>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="relative mr-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
                JD
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-white"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div>
              <h2 className="text-lg font-medium">John Doe</h2>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">{shortAddress}</p>
                <CopyButton value={walletAddress} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-assets">Total Assets (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="total-assets"
                type="number"
                value={totalAssets}
                onChange={(e) => setTotalAssets(e.target.value)}
                className="pl-7 bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crypto-investment">Crypto Investment (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="crypto-investment"
                type="number"
                value={cryptoInvestment}
                onChange={(e) => setCryptoInvestment(e.target.value)}
                className="pl-7 bg-background/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DA1F2]/10">
                <Twitter className="h-5 w-5 text-[#1DA1F2]" />
              </div>
              <div>
                <p className="font-medium">Twitter (X)</p>
                <p className="text-sm text-muted-foreground">Connect your Twitter account</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleConnectTwitter} disabled={isConnectingTwitter}>
              {isConnectingTwitter ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardContent className="pt-6">
          <h3 className="mb-4 text-lg font-medium">Investment Preferences</h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Risk Tolerance</Label>
              <RadioGroup value={riskTolerance} onValueChange={setRiskTolerance} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="risk-low" />
                  <Label htmlFor="risk-low" className="cursor-pointer">
                    Low
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="risk-medium" />
                  <Label htmlFor="risk-medium" className="cursor-pointer">
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="risk-high" />
                  <Label htmlFor="risk-high" className="cursor-pointer">
                    High
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trading-style">Trading Style</Label>
              <Select value={tradingStyle} onValueChange={setTradingStyle}>
                <SelectTrigger id="trading-style">
                  <SelectValue placeholder="Select trading style" />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-sm border-white/10">
                  <SelectItem value="day">Day Trading</SelectItem>
                  <SelectItem value="swing">Swing Trading</SelectItem>
                  <SelectItem value="long">Long-term Holding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="staking-preference">Staking Preference</Label>
                <p className="text-sm text-muted-foreground">Enable automatic staking suggestions</p>
              </div>
              <Switch id="staking-preference" checked={stakingEnabled} onCheckedChange={setStakingEnabled} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSavePreferences} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
};

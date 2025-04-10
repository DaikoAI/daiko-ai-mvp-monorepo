"use client";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/trpc/react";
import type { Session } from "next-auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type UserSettingsProps = {
  user: Session["user"];
  initialSettings: {
    tradeStyle: "day" | "swing" | "long";
    totalAssetUsd: number;
    cryptoInvestmentUsd: number;
    age: number;
  };
};

export const UserSettings: React.FC<UserSettingsProps> = ({ user, initialSettings }) => {
  const router = useRouter();
  // 初期値はサーバーから渡されたデータを使用、または適切なデフォルト値
  const [tradeStyle, setTradeStyle] = useState(initialSettings?.tradeStyle || user.tradeStyle || "swing");
  const [totalAssetUsd, setTotalAssetUsd] = useState(
    initialSettings?.totalAssetUsd?.toString() || user.totalAssetUsd?.toString() || "0",
  );
  const [cryptoInvestmentUsd, setCryptoInvestmentUsd] = useState(
    initialSettings?.cryptoInvestmentUsd?.toString() || user.cryptoInvestmentUsd?.toString() || "0",
  );
  const [age, setAge] = useState(initialSettings?.age?.toString() || user.age?.toString() || "0");
  const [isSaving, setIsSaving] = useState(false);

  const walletAddress = user.walletAddress;
  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  // 設定更新用のミューテーション
  const updateUserMutation = api.users.updateUserSettings.useMutation({
    onSuccess: () => {
      toast.success("設定を保存しました", {
        description: "投資設定が正常に更新されました。",
      });
      // クライアント側でルーターを使用して、ページデータを再検証
      router.refresh();
    },
    onError: (error) => {
      toast.error("設定の保存に失敗しました", {
        description: error.message,
      });
    },
  });

  const handleSavePreferences = async () => {
    setIsSaving(true);

    // DBのスキーマに合わせてデータを更新
    updateUserMutation.mutate({
      tradeStyle: tradeStyle as "day" | "swing" | "long",
      totalAssetUsd,
      cryptoInvestmentUsd,
      age,
    });

    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card glass>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="relative mr-4">
              <Image src={user.image} alt="User" width={80} height={80} className="rounded-full" />
            </div>

            <div>
              <h2 className="text-lg font-medium">{user.name}</h2>
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
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
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
                value={totalAssetUsd}
                onChange={(e) => setTotalAssetUsd(e.target.value)}
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
                value={cryptoInvestmentUsd}
                onChange={(e) => setCryptoInvestmentUsd(e.target.value)}
                className="pl-7 bg-background/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardContent className="pt-6">
          <h3 className="mb-4 text-lg font-medium">Investment Preferences</h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="trading-style">Trading Style</Label>
              <Select value={tradeStyle} onValueChange={(value) => setTradeStyle(value as "day" | "swing" | "long")}>
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
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Button
          className="w-full bg-primary hover:bg-primary/90"
          onClick={handleSavePreferences}
          disabled={isSaving || updateUserMutation.isPending}
        >
          {updateUserMutation.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
};

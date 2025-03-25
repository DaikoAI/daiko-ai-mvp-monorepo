"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { cn } from "@/utils";
import { Progress } from "@/components/ui/progress";

// Mock data for perpetual positions with real logos
const perpetualPositions = [
  {
    id: "1",
    market: "SOL-PERP",
    exchange: "Drift Protocol",
    position: "Long",
    size: 10,
    leverage: 5,
    entryPrice: 195.5,
    currentPrice: 205.0,
    liquidationPrice: 165.75,
    pnl: 95.0,
    pnlPercent: 4.86,
    iconUrl:
      "https://img-cdn.sonar.watch/?image=https://raw.githubusercontent.com/sonarwatch/token-registry/main/img/common/SOL.webp",
  },
  {
    id: "2",
    market: "ETH-PERP",
    exchange: "Mango Markets",
    position: "Short",
    size: 1.5,
    leverage: 3,
    entryPrice: 1950.0,
    currentPrice: 1911.0,
    liquidationPrice: 2145.0,
    pnl: 58.5,
    pnlPercent: 2.0,
    iconUrl:
      "https://wsrv.nl/?w=48&h=48&url=https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png",
  },
];

export function PerpetualPositions() {
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPosition(expandedPosition === id ? null : id);
  };

  // Calculate liquidation risk percentage
  const calculateRisk = (position: (typeof perpetualPositions)[0]) => {
    const { position: posType, currentPrice, liquidationPrice } = position;

    if (posType === "Long") {
      const distance = currentPrice - liquidationPrice;
      const percentage = (distance / currentPrice) * 100;
      return Math.min(100, Math.max(0, percentage));
    } else {
      const distance = liquidationPrice - currentPrice;
      const percentage = (distance / currentPrice) * 100;
      return Math.min(100, Math.max(0, percentage));
    }
  };

  // Get risk level text
  const getRiskLevel = (riskPercentage: number) => {
    if (riskPercentage > 20) return "Low";
    if (riskPercentage > 10) return "Medium";
    return "High";
  };

  return (
    <Card glass>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">📉 Perpetual Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {perpetualPositions.map((position) => {
            const riskPercentage = calculateRisk(position);
            const riskLevel = getRiskLevel(riskPercentage);

            return (
              <div key={position.id} className="rounded-xl glass shadow-sm transition-all duration-200 hover:shadow-md">
                <div
                  className="flex cursor-pointer items-center justify-between p-4"
                  onClick={() => toggleExpand(position.id)}
                >
                  <div className="flex items-center">
                    <img
                      src={position.iconUrl}
                      alt={position.market}
                      className="mr-3 h-10 w-10 rounded-full object-contain bg-black/20 p-0.5"
                      loading="lazy"
                    />
                    <div>
                      <h3 className="font-medium">{position.market}</h3>
                      <p className={cn("text-sm", position.position === "Long" ? "text-green-500" : "text-red-500")}>
                        {position.position} {position.leverage}x
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="mr-3 text-right">
                      <p className={cn("font-medium", position.pnl >= 0 ? "text-green-500" : "text-red-500")}>
                        {position.pnl >= 0 ? "+" : ""}
                        {position.pnl.toFixed(2)} USD
                      </p>
                      <p className={cn("text-sm", position.pnl >= 0 ? "text-green-500" : "text-red-500")}>
                        {position.pnl >= 0 ? "+" : ""}
                        {position.pnlPercent.toFixed(2)}%
                      </p>
                    </div>
                    {expandedPosition === position.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    expandedPosition === position.id ? "max-h-64" : "max-h-0",
                  )}
                >
                  <div className="border-t border-white/5 p-4">
                    <div className="mb-3 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Size</p>
                        <p className="font-medium">
                          {position.size} {position.market.split("-")[0]}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Exchange</p>
                        <p className="font-medium">{position.exchange}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Entry Price</p>
                        <p className="font-medium">${position.entryPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="font-medium">${position.currentPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertTriangle
                            className={cn(
                              "mr-1 h-4 w-4",
                              riskLevel === "High"
                                ? "text-red-500"
                                : riskLevel === "Medium"
                                  ? "text-yellow-500"
                                  : "text-green-500",
                            )}
                          />
                          <p className="text-sm">
                            Liquidation Risk: <span className="font-medium">{riskLevel}</span>
                          </p>
                        </div>
                        <p className="text-sm font-medium">${position.liquidationPrice.toFixed(2)}</p>
                      </div>

                      <Progress
                        value={riskPercentage}
                        className="h-2"
                        indicatorClassName={cn(
                          riskLevel === "High"
                            ? "bg-red-500"
                            : riskLevel === "Medium"
                              ? "bg-yellow-500"
                              : "bg-green-500",
                        )}
                      />

                      <p className="text-xs text-muted-foreground">
                        {position.position === "Long"
                          ? `Price needs to drop ${riskPercentage.toFixed(1)}% to liquidation`
                          : `Price needs to rise ${riskPercentage.toFixed(1)}% to liquidation`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

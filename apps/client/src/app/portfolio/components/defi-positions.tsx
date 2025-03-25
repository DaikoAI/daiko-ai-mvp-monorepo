"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/utils";

// Mock data for DeFi positions with real logos
const defiPositions = [
  {
    id: "1",
    protocol: "Infinite Finance",
    type: "Liquid Staking",
    asset: "SOL",
    stakedAmount: 25.5,
    valueUSD: 5227.5,
    apy: 6.8,
    rewards: "INF",
    iconUrl: "https://sonarwatch.github.io/portfolio/assets/images/platforms/marinade.webp",
  },
  {
    id: "2",
    protocol: "Jito",
    type: "Liquid Staking",
    asset: "SOL",
    stakedAmount: 12.0,
    valueUSD: 2460.0,
    apy: 7.2,
    rewards: "jitoSOL + JTO",
    iconUrl: "https://wsrv.nl/?w=48&h=48&url=https://metadata.jito.network/token/jto/image",
  },
  {
    id: "3",
    protocol: "Kamino Finance",
    type: "Liquidity Provision",
    asset: "SOL-USDC",
    stakedAmount: 5.0,
    valueUSD: 1025.0,
    apy: 12.5,
    rewards: "KMNO",
    iconUrl: "https://sonar.watch/img/platforms/kamino.webp",
  },
];

export function DefiPositions() {
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPosition(expandedPosition === id ? null : id);
  };

  return (
    <Card glass>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">🔹 DeFi Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {defiPositions.map((position) => (
            <div key={position.id} className="rounded-xl glass shadow-sm transition-all duration-200 hover:shadow-md">
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() => toggleExpand(position.id)}
              >
                <div className="flex items-center">
                  <img
                    src={position.iconUrl}
                    alt={position.protocol}
                    className="mr-3 h-10 w-10 rounded-full object-contain bg-black/20 p-0.5"
                    loading="lazy"
                  />
                  <div>
                    <h3 className="font-medium">{position.protocol}</h3>
                    <p className="text-sm text-muted-foreground">
                      {position.type} • {position.asset}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="mr-3 text-right">
                    <p className="font-medium">${position.valueUSD.toLocaleString()}</p>
                    <p className="text-sm text-green-500">{position.apy}% APY</p>
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
                  expandedPosition === position.id ? "max-h-48" : "max-h-0",
                )}
              >
                <div className="border-t border-white/5 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Staked Amount</p>
                      <p className="font-medium">
                        {position.stakedAmount} {position.asset}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Value (USD)</p>
                      <p className="font-medium">${position.valueUSD.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rewards</p>
                      <p className="font-medium">{position.rewards}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Protocol</p>
                      <a href="#" className="flex items-center text-primary hover:underline">
                        Visit <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

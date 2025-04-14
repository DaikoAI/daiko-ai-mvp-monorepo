"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";
import { cn } from "@/utils";
import { useState } from "react";

type TimeRange = "1d" | "7d" | "30d" | "90d" | "1y";

type PnLChartProps = {
  initialData?: RouterOutputs["portfolio"]["getUserPnl"];
};

export const PnLChart: React.FC<PnLChartProps> = ({ initialData }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [displayUnit, setDisplayUnit] = useState<"SOL" | "USD">("USD");

  // クライアントサイドでPnLデータを再取得
  const { data: pnlData } = api.portfolio.getUserPnl.useQuery(
    {
      walletAddress: initialData?.wallet_address || "",
      period: timeRange,
    },
    {
      initialData: initialData && timeRange === initialData.period ? initialData : undefined,
      enabled: !!initialData?.wallet_address,
    },
  );

  const currentValue = pnlData?.summary?.pnl_absolute ? parseFloat(pnlData.summary.pnl_absolute) : 0;
  const isPositive = currentValue >= 0;

  // PnLデータをチャート用のフォーマットに変換
  const chartData =
    pnlData?.pnl_data.map((item) => ({
      time: new Date(item.timestamp).toLocaleString("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: parseFloat(item.pnl_absolute),
    })) || [];

  const formatValue = (value: number) => {
    if (displayUnit === "USD") {
      return `$${value.toFixed(2)}`;
    } else {
      return `${(value / 205).toFixed(3)} SOL`;
    }
  };

  return (
    <Card glass className={isPositive ? "border-green-500/20" : "border-red-500/20"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">PnL</CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant={displayUnit === "USD" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDisplayUnit("USD")}
            >
              USD
            </Button>
            <Button
              variant={displayUnit === "SOL" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDisplayUnit("SOL")}
            >
              SOL
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{timeRange.toUpperCase()} Change</p>
            <p className={cn("text-2xl font-bold", isPositive ? "value-up" : "value-down")}>
              {isPositive ? "+" : ""}
              {formatValue(currentValue)}
            </p>
          </div>

          <div className="flex space-x-1">
            <Button
              variant={timeRange === "1d" ? "glass" : "outline"}
              size="sm"
              className={cn("h-8 px-3", timeRange === "1d" && "border-primary/30 bg-primary/10 text-primary")}
              onClick={() => setTimeRange("1d")}
            >
              24H
            </Button>
            <Button
              variant={timeRange === "7d" ? "glass" : "outline"}
              size="sm"
              className={cn("h-8 px-3", timeRange === "7d" && "border-primary/30 bg-primary/10 text-primary")}
              onClick={() => setTimeRange("7d")}
            >
              7D
            </Button>
            <Button
              variant={timeRange === "30d" ? "glass" : "outline"}
              size="sm"
              className={cn("h-8 px-3", timeRange === "30d" && "border-primary/30 bg-primary/10 text-primary")}
              onClick={() => setTimeRange("30d")}
            >
              30D
            </Button>
            <Button
              variant={timeRange === "90d" ? "glass" : "outline"}
              size="sm"
              className={cn("h-8 px-3", timeRange === "90d" && "border-primary/30 bg-primary/10 text-primary")}
              onClick={() => setTimeRange("90d")}
            >
              90D
            </Button>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="rgba(255,255,255,0.3)" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="rgba(255,255,255,0.3)"
                tickFormatter={(value) => {
                  if (displayUnit === "USD") {
                    return `$${value}`;
                  } else {
                    return `${(value / 205).toFixed(1)}`;
                  }
                }}
              />
              <Tooltip
                formatter={(value: number) => [formatValue(value), "Value"]}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: "rgba(30, 30, 30, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "white",
                  backdropFilter: "blur(8px)",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "#10B981" : "#EF4444"}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

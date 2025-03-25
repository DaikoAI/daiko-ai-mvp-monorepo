"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "@/components/ui/chart";
import { Asset } from "@/types";
import { cn } from "@/utils";
import { useMemo, useState } from "react";

// 共通色パレット
const COLOR_PALETTE = [
  "#00FFA3",
  "#2775CA",
  "#9945FF",
  "#FF7C59",
  "#F6C343",
  "#E559FF",
  "#6E6E6E",
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
];

// NFT用の固定色（コレクション別に色分けする場合に使用）
const NFT_COLORS = {
  default: "#8B5CF6", // デフォルト紫色
};

// デフォルトアイコン
const DEFAULT_ICON = "/icon.jpg";

type PortfolioChartProps = {
  assets: Asset[];
};

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ assets }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // チャートデータとトータル値を計算
  const { chartData, totalPortfolioValue } = useMemo(() => {
    // 価値ごとにアセットをグループ化
    const assetsByValue = new Map<string, { totalValue: number; assets: Asset[]; isNFT: boolean }>();

    // 合計値を計算
    let totalValue = 0;

    // 各アセットを処理
    assets.forEach((asset) => {
      // 価格情報がない場合はスキップ
      if (!asset.token_info?.price_info?.total_price) return;

      // 通貨を確認、USDCに統一
      // const currency = asset.token_info?.price_info?.currency || "USDC";

      // 異なる通貨の場合は変換が必要（ここではすべてUSDCに変換済みと仮定）
      const value = asset.token_info.price_info.total_price;

      // NFTかどうかをチェック
      const isNFT = asset.interface === "ProgrammableNFT";

      // カテゴリを設定
      let category;
      if (isNFT) {
        // NFTの場合はコレクション名またはシンボルをカテゴリとする
        const collectionName = asset.grouping[0]?.collection_metadata?.name;
        category = collectionName || "NFTs";
      } else {
        // 通常のトークンの場合はシンボルをカテゴリとする
        category = asset.token_info.symbol;
      }

      // カテゴリー別に合計を計算
      if (assetsByValue.has(category)) {
        const existingData = assetsByValue.get(category)!;
        existingData.totalValue += value;
        existingData.assets.push(asset);
      } else {
        assetsByValue.set(category, { totalValue: value, assets: [asset], isNFT });
      }

      totalValue += value;
    });

    // "Other"カテゴリに入れるしきい値（合計の1%未満は「その他」にグループ化）
    const otherThreshold = totalValue * 0.01;
    let otherValue = 0;
    const otherAssets: Asset[] = [];
    let otherHasNFT = false;

    // チャートデータを構築
    let data: any[] = [];
    let colorIndex = 0;

    assetsByValue.forEach((categoryData, category) => {
      if (categoryData.totalValue < otherThreshold) {
        // しきい値未満は「その他」にまとめる
        otherValue += categoryData.totalValue;
        otherAssets.push(...categoryData.assets);
        otherHasNFT = otherHasNFT || categoryData.isNFT;
      } else {
        // チャートに表示するデータを追加
        const percentage = (categoryData.totalValue / totalValue) * 100;
        const isNFT = categoryData.isNFT;

        // アイコンURLまたは色を設定
        let iconUrl = DEFAULT_ICON;
        if (!isNFT) {
          // 通常のトークンの場合は画像を取得
          const representativeAsset = categoryData.assets[0];
          if (
            representativeAsset.content &&
            representativeAsset.content.links &&
            representativeAsset.content.links.image
          ) {
            iconUrl = representativeAsset.content.links.image;
          } else if (
            representativeAsset.content &&
            representativeAsset.content.files &&
            representativeAsset.content.files.length > 0
          ) {
            iconUrl =
              representativeAsset.content.files[0].uri || representativeAsset.content.files[0].cdn_uri || DEFAULT_ICON;
          }
        }

        // 色の割り当て
        const color = isNFT
          ? NFT_COLORS[category as keyof typeof NFT_COLORS] || NFT_COLORS.default
          : COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];

        data.push({
          name: category,
          value: Number(percentage.toFixed(1)),
          rawValue: categoryData.totalValue,
          color: color,
          iconUrl: isNFT ? null : iconUrl, // NFTは画像を表示しない
          isNFT: isNFT,
        });

        colorIndex++;
      }
    });

    // 「その他」カテゴリを追加（存在する場合）
    if (otherValue > 0 && otherAssets.length > 0) {
      data.push({
        name: "Other",
        value: Number(((otherValue / totalValue) * 100).toFixed(1)),
        rawValue: otherValue,
        color: COLOR_PALETTE[COLOR_PALETTE.length - 1],
        iconUrl: otherHasNFT ? null : DEFAULT_ICON, // NFTを含む場合は画像を表示しない
        isNFT: otherHasNFT,
      });
    }

    // 合計が0の場合にエラーを防ぐため、空の配列の代わりにダミーデータを返す
    if (totalValue === 0) {
      return {
        chartData: [
          {
            name: "No Assets",
            value: 100,
            rawValue: 0,
            color: "#6E6E6E",
            iconUrl: null,
            isNFT: false,
          },
        ],
        totalPortfolioValue: 0,
      };
    }

    // 降順でソート（大きな値が先に表示されるように）
    data.sort((a, b) => b.rawValue - a.rawValue);

    return {
      chartData: data,
      totalPortfolioValue: totalValue,
    };
  }, [assets]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Asset Distribution</CardTitle>
          <p className="text-sm font-medium text-primary">
            ${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={activeIndex === index ? "white" : "transparent"}
                    strokeWidth={2}
                    style={{
                      filter: activeIndex === index ? "drop-shadow(0 0 10px rgba(255,255,255,0.7))" : "none",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl p-3 shadow-md bg-card">
                        <div className="flex items-center mb-1">
                          {data.isNFT ? (
                            <div
                              className="w-5 h-5 mr-2 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: data.color }}
                            >
                              <span className="text-xs text-white">NFT</span>
                            </div>
                          ) : (
                            <img
                              src={data.iconUrl || DEFAULT_ICON}
                              alt={data.name}
                              className="w-5 h-5 mr-2 rounded-full bg-black/20 p-0.5 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = DEFAULT_ICON;
                              }}
                            />
                          )}
                          <p className="font-medium text-primary">{data.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {data.value}% (${data.rawValue.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {chartData.map((entry, index) => (
            <div
              key={`legend-${index}`}
              className={cn("flex items-center rounded-full px-2 py-1", activeIndex === index ? "bg-secondary/50" : "")}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              style={{ cursor: "pointer" }}
            >
              {entry.isNFT ? (
                <div className="w-3 h-3 mr-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              ) : (
                <img
                  src={entry.iconUrl || DEFAULT_ICON}
                  alt={entry.name}
                  className="w-3 h-3 mr-1.5 rounded-full bg-black/20 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_ICON;
                  }}
                />
              )}
              <span className={cn("text-xs", activeIndex === index ? "font-medium" : "")}>
                {entry.name} ({entry.value}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

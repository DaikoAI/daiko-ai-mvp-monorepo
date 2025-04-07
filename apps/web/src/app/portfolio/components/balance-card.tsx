import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/server";

type BalanceCardProps = {
  walletAddress: string;
};

export const BalanceCardComponent: React.FC<BalanceCardProps> = async ({ walletAddress }) => {
  // tRPCのAPIを使用してPnLデータを取得 (RSCでの呼び出し)
  const pnlData = await api.portfolio.getUserPnl({
    walletAddress,
    period: "1d",
  });

  const portfolioData = await api.portfolio.getUserPortfolio({
    walletAddress,
    forceRefresh: false,
  });

  // PnLデータを取得、存在しない場合は 0 を使用
  const dailyChangeValue = parseFloat(pnlData?.summary?.pnl_absolute ?? "0");
  const dailyChange = parseFloat(pnlData?.summary?.pnl_percentage ?? "0");

  // ポートフォリオの合計価値
  const totalValue = parseFloat(portfolioData.total_value_usd || "0");

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
        <div className="text-4xl font-bold text-white">${totalValue.toLocaleString()}</div>
        <div className="flex items-center space-x-2 mt-1">
          <span
            className={`text-sm font-medium px-2 py-0.5 rounded-md ${dailyChange > 0 ? "bg-[#2DD48B]/8 text-[#2DD48B]" : "bg-[#CD2828]/12 text-[#CD2828]"}`}
          >
            {dailyChange > 0 ? "+" : ""}
            {dailyChange.toFixed(2)}%
          </span>
          <span className={`text-lg font-semibold ${dailyChange > 0 ? "text-[#2DD48B]" : "text-[#CD2828]"}`}>
            {dailyChange > 0 ? "+" : "-"}${Math.abs(dailyChangeValue).toLocaleString()}
          </span>
        </div>
      </div>
    </section>
  );
};

const BalanceCardSkeleton: React.FC = () => {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
        <Skeleton className="h-10 w-2/3" />
        <div className="flex items-center space-x-2 mt-1">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
    </section>
  );
};

export const BalanceCard = Object.assign(BalanceCardComponent, {
  Skeleton: BalanceCardSkeleton,
});

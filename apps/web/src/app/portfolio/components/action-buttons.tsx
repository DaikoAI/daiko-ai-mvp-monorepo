"use client";

import { RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHaptic } from "use-haptic";
import { revalidatePortfolio } from "../../actions";
type ActionButtonsProps = {
  onRefresh?: () => Promise<void>;
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onRefresh }) => {
  const router = useRouter();
  const { triggerHaptic } = useHaptic();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: session } = useSession();

  // const handleAddClick = () => {
  //   triggerHaptic();
  //   // ここに資産追加ページへの遷移ロジックを追加
  //   // router.push('/add-asset');
  // };

  const handleRefreshClick = async () => {
    if (isRefreshing) return;

    triggerHaptic();
    setIsRefreshing(true);

    try {
      if (onRefresh) {
        await onRefresh();
      }
      // フォールバックとして画面を更新
      router.refresh();
      revalidatePortfolio(session?.user.walletAddress);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* <button
        onClick={handleAddClick}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Plus size={24} className="text-white" />
      </button> */}
      <button
        onClick={handleRefreshClick}
        disabled={isRefreshing}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <RefreshCw size={20} className={`text-white ${isRefreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
};

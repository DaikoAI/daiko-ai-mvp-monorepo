"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const RefreshButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Simulate data refresh
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Portfolio data refreshed", {
      description: "Your portfolio data has been updated with the latest prices and positions.",
    });

    setIsRefreshing(false);
  };
  return (
    <Button
      variant="glass"
      size="sm"
      className="h-8 border border-primary/20 hover:bg-primary/20"
      onClick={handleRefresh}
      disabled={isRefreshing}
    >
      <RefreshCw className={`mr-2 h-3.5 w-3.5 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Syncing..." : "Sync"}
    </Button>
  );
};

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FinancialImpact, Proposal, ProposalUserPreference } from "@/types/proposal";
import { cn } from "@/utils";
import { getTimeRemaining, isWithin24Hours } from "@/utils/date";
import { Bot, Check, ChevronDown, ChevronUp, Clock, ExternalLink, Loader2, Twitter, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Type colors mapping
const typeColors = {
  trade: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  stake: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  risk: "bg-red-500/20 text-red-500 border-red-500/30",
  opportunity: "bg-green-500/20 text-green-500 border-green-500/30",
};

// Type labels
const typeLabels = {
  trade: "Trade",
  stake: "Stake",
  risk: "Risk Alert",
  opportunity: "Opportunity",
};

// PnLビジュアライゼーションコンポーネント
const ProposalPnLVisualization: React.FC<{ financialImpact?: FinancialImpact; proposalType?: string }> = ({
  financialImpact,
  proposalType,
}) => {
  if (!financialImpact) return null;

  const isPositive = financialImpact.percentChange > 0;
  const isStaking = proposalType === "stake";

  // Staking提案の場合、現在の収益を0として表示
  const currentValue = isStaking ? 0 : financialImpact.currentValue;
  const projectedValue = isStaking
    ? Math.round(financialImpact.currentValue * (financialImpact.percentChange / 100))
    : financialImpact.projectedValue;

  // 差分計算
  const diffValue = isStaking
    ? projectedValue
    : Math.abs(financialImpact.projectedValue - financialImpact.currentValue);

  return (
    <div className="mt-3 p-3 rounded-lg bg-card/50">
      <div className="text-xs text-muted-foreground mb-1">Price Prediction</div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Current</span>
            <span className="font-medium">${currentValue.toLocaleString()}</span>
            {isStaking && <span className="text-xs text-muted-foreground">(No earnings)</span>}
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Expected</span>
            <span className="font-medium">${projectedValue.toLocaleString()}</span>
            {isStaking && (
              <span className="text-xs text-muted-foreground">(With APY ${financialImpact.percentChange}%)</span>
            )}
          </div>
        </div>

        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
          }`}
        >
          {isPositive ? "+" : ""}
          {financialImpact.percentChange}% (${diffValue.toLocaleString()})
        </div>
      </div>
    </div>
  );
};

// 残り時間表示コンポーネント
const TimeRemaining: React.FC<{ expiresAt: Date }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      // 自作の関数を使用
      setTimeLeft(getTimeRemaining(expiresAt));
      setIsExpiringSoon(isWithin24Hours(expiresAt));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // 1分ごとに更新

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div
      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
        ${isExpiringSoon ? "bg-red-500/20 text-red-500" : "bg-secondary/80 text-secondary-foreground"}`}
    >
      <Clock className={`h-3 w-3 ${isExpiringSoon ? "animate-pulse" : ""}`} />
      <span className={isExpiringSoon ? "animate-pulse" : ""}>{timeLeft}</span>
    </div>
  );
};

export const ProposalCard: React.FC<{ proposal: Proposal; onRemove?: (id: string) => void }> = ({
  proposal,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [detailHeight, setDetailHeight] = useState<number | undefined>(undefined);
  const detailRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showShareDialog, setShowShareDialog] = useState(false);

  // ユーザー設定
  const [userPreferences, setUserPreferences] = useState<ProposalUserPreference>({
    hideProposal: false,
    holdToken: false,
    holdUntil: "1month",
  });

  // ローカルストレージからユーザー設定を読み込む
  useEffect(() => {
    const savedPrefs = localStorage.getItem(`proposal_prefs_${proposal.id}`);
    if (savedPrefs) {
      setUserPreferences(JSON.parse(savedPrefs));
    }
  }, [proposal.id]);

  // ユーザー設定を保存する
  const saveUserPreferences = (prefs: ProposalUserPreference) => {
    setUserPreferences(prefs);
    localStorage.setItem(`proposal_prefs_${proposal.id}`, JSON.stringify(prefs));
  };

  useEffect(() => {
    if (expanded && detailRef.current) {
      setDetailHeight(detailRef.current.scrollHeight);
    } else {
      setDetailHeight(0);
    }
  }, [expanded]);

  const handleAccept = async () => {
    setIsAccepting(true);

    // Simulate transaction processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 提案受け入れツイート用のテキスト作成
    const tweetText = `I just accepted a proposal to "${proposal.title}" with Daiko AI. 🚀 Managing my crypto portfolio is getting smarter! #DaikoAI #CryptoPortfolio`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    toast.success("Proposal accepted", {
      description: "You can check your portfolio for updated positions.",
      action: {
        label: "Tweet",
        onClick: () => window.open(tweetUrl, "_blank"),
      },
      icon: <Check className="h-4 w-4" />,
      duration: 8000,
    });

    setIsAccepting(false);
    setShowShareDialog(true);

    // Remove the proposal after acceptance
    if (onRemove) {
      onRemove(proposal.id);
    }
  };

  const handleDecline = () => {
    toast.error("Proposal declined", {
      description: `The ${proposal.title} proposal has been declined.`,
    });

    // Remove the proposal after declining
    if (onRemove) {
      onRemove(proposal.id);
    }
  };

  const handleAskAI = () => {
    // reasonがリスト形式になっているため、テキスト形式に変換
    const reasonText = proposal.reason.join(". ");
    // Navigate to chat with pre-filled message
    router.push(`/chat?q=${encodeURIComponent(`Tell me more about this proposal: ${proposal.title}. ${reasonText}`)}`);
  };

  return (
    <>
      <Card
        className="overflow-hidden border-l-4 transition-all relative"
        style={{ borderLeftColor: getTypeColor(proposal.type) }}
      >
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-full border",
                typeColors[proposal.type || "opportunity"],
              )}
            >
              {typeLabels[proposal.type || "opportunity"]}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center text-xs text-muted-foreground">
                <Bot className="mr-1 h-3.5 w-3.5" />
                {proposal.proposedBy || "AI XBT"}
              </div>

              {proposal.expires_at && <TimeRemaining expiresAt={proposal.expires_at} />}
            </div>
          </div>
          <CardTitle className="text-lg mt-2">{proposal.title}</CardTitle>
          {/* <p className="text-sm text-muted-foreground">{proposal.summary}</p> */}

          {/* 損益ビジュアライゼーション */}
          {proposal.financialImpact && (
            <ProposalPnLVisualization financialImpact={proposal.financialImpact} proposalType={proposal.type} />
          )}
        </CardHeader>
        <CardContent>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: detailHeight ? `${detailHeight}px` : "0" }}
          >
            <div ref={detailRef} className="space-y-4">
              <div className="mb-4">
                <h3 className="font-medium mb-2">Reasons:</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                  {proposal.reason.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" size="sm" className="text-xs w-full max-w-md" onClick={handleAskAI}>
                  Ask AI for More Details
                </Button>
              </div>

              <h4 className="mb-2 font-medium">Data Sources:</h4>
              <ul className="space-y-1">
                {proposal.sources.map((source, index) => (
                  <li key={index} className="flex items-center text-xs">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    <a
                      href={source.url}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.name}
                    </a>
                  </li>
                ))}
              </ul>

              {/* ユーザー設定セクション */}
              <div className="mt-4 pt-4 border-t border-muted">
                <div className="text-xs font-medium mb-2">Your preferences</div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`hide-${proposal.id}`} className="text-xs text-muted-foreground">
                      Don't show similar proposals
                    </Label>
                    <Switch
                      id={`hide-${proposal.id}`}
                      checked={userPreferences.hideProposal}
                      onCheckedChange={(checked) => saveUserPreferences({ ...userPreferences, hideProposal: checked })}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`hold-${proposal.id}`} className="text-xs text-muted-foreground">
                      Hold this asset for at least
                    </Label>
                    <select
                      className="h-7 text-xs rounded-md border border-input bg-transparent px-2"
                      value={userPreferences.holdUntil}
                      onChange={(e) => saveUserPreferences({ ...userPreferences, holdUntil: e.target.value })}
                      disabled={!userPreferences.holdToken}
                    >
                      <option value="1month">1 month</option>
                      <option value="3months">3 months</option>
                      <option value="6months">6 months</option>
                      <option value="1year">1 year</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0">
          <div className="flex w-full justify-between">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExpanded(!expanded)}>
              {expanded ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Show Details
                </>
              )}
            </Button>
          </div>

          <div className="flex w-full gap-2">
            <Button variant="destructive" className="flex-1" onClick={handleDecline}>
              <X className="mr-2 h-4 w-4" />
              Decline
            </Button>

            <Button variant="success" className="flex-1" onClick={handleAccept} disabled={isAccepting}>
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Accept
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* シェアダイアログ */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Investment Decision</DialogTitle>
            <DialogDescription>Let your followers know about your latest investment move!</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm">
              I just accepted a proposal to {proposal.title.toLowerCase()} 📈 via @DaikoAI #InvestSmart
            </p>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
            <Button
              className="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white"
              onClick={() => {
                const text = `I just accepted a proposal to ${proposal.title.toLowerCase()} 📈 via @DaikoAI #InvestSmart`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                setShowShareDialog(false);
              }}
            >
              <Twitter size={18} />
              Share on Twitter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// 追加する関数
function getTypeColor(type?: "trade" | "stake" | "risk" | "opportunity"): string {
  switch (type) {
    case "trade":
      return "var(--blue-500, #3b82f6)";
    case "stake":
      return "var(--purple-500, #8b5cf6)";
    case "risk":
      return "var(--red-500, #ef4444)";
    case "opportunity":
      return "var(--green-500, #10b981)";
    default:
      return "#6c6c6c";
  }
}

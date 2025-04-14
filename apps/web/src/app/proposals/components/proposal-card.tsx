"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlphaWallet } from "@/features/alphaWallet/AlphaWalletProvider";
import type { AlphaTx, ContractCall } from "@/features/alphaWallet/types";
import { contractCallToInstruction } from "@/features/alphaWallet/types";
import { cn } from "@/utils";
import { getTimeRemaining } from "@/utils/date";
import type { ProposalSelect } from "@daiko-ai/shared";
import { AlertCircle, Bot, Check, ChevronDown, ChevronUp, ExternalLink, Loader2, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AskAIButton } from "./ask-ai-button";

// Type styles - Adjusted for Glassmorphism & Figma
const typeStyles = {
  trade: {
    icon: <Bot size={16} className="text-blue-300" />,
    label: "Trade",
    bgColor: "bg-gradient-to-r from-blue-500/50 to-white/20",
    textColor: "text-blue-300",
  },
  stake: {
    icon: <Plus size={16} className="text-purple-300" />,
    label: "Staking",
    bgColor: "bg-gradient-to-r from-purple-500/50 to-white/20",
    textColor: "text-purple-300",
  },
  risk: {
    icon: <AlertCircle size={16} className="text-red-400" />,
    label: "Risk Alert",
    bgColor: "bg-gradient-to-r from-red-600/50 to-white/20",
    textColor: "text-red-400",
  },
  opportunity: {
    icon: <Bot size={16} className="text-green-400" />,
    label: "Opportunity",
    bgColor: "bg-gradient-to-r from-green-500/50 to-white/20",
    textColor: "text-green-400",
  },
};

// PnL Visualization - Adjusted for readability
const ProposalPnLVisualization: React.FC<{
  financialImpact?: {
    currentValue: number;
    projectedValue: number;
    percentChange: number;
  };
  proposalType?: string | null;
}> = ({ financialImpact, proposalType }) => {
  if (!financialImpact) return null;

  const isPositive = financialImpact.percentChange > 0;
  const isStaking = proposalType === "stake";

  const currentValue = isStaking ? 0 : financialImpact.currentValue;
  const projectedValue = isStaking
    ? Math.round(financialImpact.currentValue * (financialImpact.percentChange / 100))
    : financialImpact.projectedValue;

  return (
    // Slightly darker background for contrast
    <div className="mt-4 p-3 rounded-lg bg-black/50">
      <div className="text-xs font-semibold text-gray-400 mb-2">Price Prediction</div>
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-400">Current</span>
            {/* Slightly larger font for values */}
            <span className="font-semibold text-sm text-white">${currentValue.toLocaleString()}</span>
            {isStaking && <span className="text-xs text-gray-500">(No earnings)</span>}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-400">
              Expected{isStaking ? ` (APY ${financialImpact.percentChange}%)` : ""}
            </span>
            <span className="font-semibold text-sm text-white">${projectedValue.toLocaleString()}</span>
          </div>
        </div>
        <div
          className={cn(
            "px-1.5 py-0.5 rounded text-xs font-medium flex items-center",
            isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400",
          )}
        >
          {isPositive ? "+" : ""}
          {financialImpact.percentChange}%
        </div>
      </div>
    </div>
  );
};

// Time Remaining - No changes needed based on last update
const TimeRemaining: React.FC<{ expiresAt: Date }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTimeLeft(getTimeRemaining(expiresAt));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-1 text-xs font-normal text-gray-400">
      <span>{timeLeft}</span>
    </div>
  );
};

export const ProposalCard: React.FC<{ proposal: ProposalSelect; onRemove?: (id: string) => void }> = ({
  proposal,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [detailHeight, setDetailHeight] = useState<number | undefined>(undefined);
  const detailRef = useRef<HTMLDivElement>(null);

  const { requestTransaction } = useAlphaWallet();

  // User preferences state remains the same
  const [userPreferences, setUserPreferences] = useState<{
    hideProposal: boolean;
    holdToken: boolean;
    holdUntil: string;
  }>({
    hideProposal: false,
    holdToken: false,
    holdUntil: "1month",
  });

  useEffect(() => {
    const savedPrefs = localStorage.getItem(`proposal_prefs_${proposal.id}`);
    if (savedPrefs) {
      setUserPreferences(JSON.parse(savedPrefs));
    }
  }, [proposal.id]);

  useEffect(() => {
    if (expanded && detailRef.current) {
      setDetailHeight(detailRef.current.scrollHeight);
    } else {
      setDetailHeight(0);
    }
  }, [expanded]);

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      if (!proposal.contractCall) {
        throw new Error("No contract call specified in the proposal");
      }

      const contractCall = {
        ...proposal.contractCall,
        params: {
          ...proposal.contractCall.params,
          fromToken: proposal.contractCall.params.fromToken,
          toToken: proposal.contractCall.params.toToken,
        },
      } as ContractCall;

      const tx: AlphaTx = {
        id: proposal.id,
        description: proposal.title,
        requestedBy: "Daiko AI",
        timestamp: Date.now(),
        instruction: contractCallToInstruction(contractCall),
      };

      const result = await requestTransaction(tx);

      if (result.success) {
        const tweetText = `I just accepted a proposal to "${proposal.title}" with Daiko AI. 🚀 Managing my crypto portfolio is getting smarter! #DaikoAI #CryptoPortfolio`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

        if (onRemove) {
          onRemove(proposal.id);
        }
      }
    } catch (error) {
      console.error("Failed to execute transaction:", error);
      toast.error("Failed to execute transaction", {
        description: error instanceof Error ? error.message : "An error occurred while processing your request.",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    toast.error("Proposal declined", {
      description: `The ${proposal.title} proposal has been declined.`,
    });
    if (onRemove) {
      onRemove(proposal.id);
    }
  };

  const currentTypeStyle = typeStyles[(proposal.type as keyof typeof typeStyles) || "opportunity"];

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl p-4 relative text-white border-none shadow-lg backdrop-blur-lg",
        currentTypeStyle.bgColor,
      )}
    >
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1">
            {currentTypeStyle.icon}
            <span className={cn("text-sm font-semibold", currentTypeStyle.textColor)}>{currentTypeStyle.label}</span>
          </div>
          {proposal.expires_at && <TimeRemaining expiresAt={proposal.expires_at} />}
        </div>
        <CardTitle className="text-base font-bold text-white">{proposal.title}</CardTitle>
        {proposal.financialImpact && (
          <ProposalPnLVisualization financialImpact={proposal.financialImpact} proposalType={proposal.type} />
        )}
      </CardHeader>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height: detailHeight === undefined ? undefined : `${detailHeight}px` }}
      >
        <div ref={detailRef} className="pb-4">
          <CardContent className="p-0 pt-2">
            <p className="text-sm text-gray-200 mb-3">{proposal.summary}</p>
            <h4 className="text-sm font-semibold text-gray-100 mb-1">Reasons:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 mb-3">
              {proposal.reason.map((r, index) => (
                <li key={index}>{r}</li>
              ))}
            </ul>
            <h4 className="text-sm font-semibold text-gray-100 mb-1">Sources:</h4>
            <div className="space-y-1 mb-4">
              {proposal.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-blue-300 hover:underline"
                >
                  {source.name}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              ))}
            </div>
            <AskAIButton proposal={proposal} />
          </CardContent>
        </div>
      </div>

      <CardFooter className="p-0 flex flex-col items-stretch space-y-3 mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-start text-sm font-medium text-white hover:bg-transparent hover:text-gray-300 px-0"
        >
          {expanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
          {expanded ? "Hide Details" : "Show Details"}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={handleDecline}
            className="flex-1 bg-[#666666] hover:bg-gray-500 text-white font-bold rounded-full h-10 text-base shadow-[0px_0px_6px_0px_rgba(255,255,255,0.24)]"
          >
            <X className="mr-1 h-5 w-5" />
            Decline
          </Button>
          <Button
            variant="default"
            onClick={handleAccept}
            disabled={isAccepting}
            className="flex-1 bg-[#FF9100] hover:bg-orange-500 text-white font-bold rounded-full h-10 text-base shadow-[0px_0px_6px_0px_rgba(255,255,255,0.24)]"
          >
            {isAccepting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-1 h-5 w-5" />}
            {isAccepting ? "Processing..." : "Accept"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

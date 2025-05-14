"use client";

import { StakingIcon } from "@/components/icon/StakingIcon";
import { TradeIcon } from "@/components/icon/TradeIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlphaWallet } from "@/features/alphaWallet/AlphaWalletProvider";
import type { AlphaTx, ContractCall } from "@/features/alphaWallet/types";
import { contractCallToInstruction } from "@/features/alphaWallet/types";
import { cn } from "@/utils";
import { getTimeRemaining } from "@/utils/date";
import type { ProposalSelect } from "@daiko-ai/shared";
import { sendGAEvent } from "@next/third-parties/google";
import { AlertCircle, Bot, Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AskAIButton } from "./ask-ai-button";
// Type styles - Adjusted for Glassmorphism & Figma
const typeStyles = {
  trade: {
    icon: <TradeIcon size={16} className="text-blue-400" />,
    label: "Trade",
    bgColor: "bg-gradient-to-r from-blue-400/30 to-white/20",
    textColor: "text-blue-400",
  },
  stake: {
    icon: <StakingIcon size={16} className="text-purple-400" />,
    label: "Staking",
    bgColor: "bg-gradient-to-r from-purple-400/30 to-white/20",
    textColor: "text-purple-400",
  },
  risk: {
    icon: <AlertCircle size={16} className="text-red-500" />,
    label: "Risk Alert",
    bgColor: "bg-gradient-to-r from-red-500/30 to-white/20",
    textColor: "text-red-500",
  },
  opportunity: {
    icon: <Bot size={16} className="text-green-500" />,
    label: "Opportunity",
    bgColor: "bg-gradient-to-r from-green-500/30 to-white/20",
    textColor: "text-green-500",
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
  const [isAccepting, setIsAccepting] = useState(false);

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
      sendGAEvent("proposal_accepted", {
        proposal_id: proposal.id,
        proposal_title: proposal.title,
        proposal_type: proposal.type,
        user_id: proposal.userId,
      });
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    toast.info("Proposal declined", {
      description: `The ${proposal.title} proposal has been declined.`,
    });
    if (onRemove) {
      onRemove(proposal.id);
    }
    sendGAEvent("proposal_declined", {
      proposal_id: proposal.id,
      proposal_title: proposal.title,
      proposal_type: proposal.type,
      user_id: proposal.userId,
    });
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
          {proposal.expiresAt && <TimeRemaining expiresAt={proposal.expiresAt} />}
        </div>
        <CardTitle className="text-base font-bold text-white">{proposal.title}</CardTitle>
        {proposal.financialImpact && (
          <ProposalPnLVisualization financialImpact={proposal.financialImpact} proposalType={proposal.type} />
        )}
      </CardHeader>

      <CardContent className="p-0 pt-2">
        <h4 className="text-sm font-semibold text-gray-100 mb-2">Reasons:</h4>
        <ul className="list-none space-y-2 text-sm text-gray-300 mb-4">
          {proposal.reason.map((reasonText, reasonIndex) => (
            <li key={reasonIndex} className="flex items-start">
              <span className="mr-2">&#8226;</span> {/* Bullet point */}
              <div>
                {reasonText}
                {proposal.sources.map((source, sourceIndex) => (
                  <a
                    key={sourceIndex}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:underline ml-1.5"
                  >
                    [{sourceIndex + 1}]
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <AskAIButton proposal={proposal} />
      </CardContent>

      <CardFooter className="p-0 flex flex-col items-stretch space-y-2 mt-4">
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

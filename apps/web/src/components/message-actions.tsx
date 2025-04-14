"use client";

import type { Vote } from "@/types";
import { cn } from "@/utils";
import type { UIMessage } from "ai";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { memo } from "react";
import { Button } from "./ui/button";

interface MessageActionsProps {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
}

const PureMessageActions: React.FC<MessageActionsProps> = ({ chatId, message, vote, isLoading }) => {
  const handleVote = async (type: "up" | "down") => {
    await fetch("/api/vote", {
      method: "POST",
      body: JSON.stringify({
        chatId,
        messageId: message.id,
        type,
      }),
    });
  };

  return (
    <div className="flex flex-row gap-2 items-center">
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-8 rounded-full", {
          "text-green-500": vote?.type === "up",
        })}
        onClick={() => handleVote("up")}
        disabled={isLoading}
      >
        <ThumbsUp className="size-4" />
        <span className="sr-only">Thumbs up</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn("size-8 rounded-full", {
          "text-red-500": vote?.type === "down",
        })}
        onClick={() => handleVote("down")}
        disabled={isLoading}
      >
        <ThumbsDown className="size-4" />
        <span className="sr-only">Thumbs down</span>
      </Button>
    </div>
  );
};

export const MessageActions = memo(PureMessageActions);

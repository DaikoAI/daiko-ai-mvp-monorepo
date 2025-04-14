import type { Message } from "ai";

import { useCopyToClipboard } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTime } from "@/utils/date";
import { CopyIcon } from "lucide-react";
import { memo } from "react";
import { toast } from "sonner";

export const PureMessageActions = ({
  threadId,
  message,
  isLoading,
}: {
  threadId: string;
  message: Message;
  isLoading: boolean;
}) => {
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === "user") return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2 justify-between items-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="p-1 h-fit text-muted-foreground bg-background/8 hover:bg-accent/12 backdrop-blur-[4px] rounded-md"
              variant="outline"
              onClick={async () => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("\n")
                  .trim();

                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                await copyToClipboard(textFromParts);
                toast.success("Copied to clipboard!");
              }}
            >
              <CopyIcon size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        <time className="text-muted-foreground text-xs" dateTime={message.createdAt?.toISOString()}>
          {formatTime(message.createdAt)}
        </time>

        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-upvote"
              className="py-1 px-2 h-fit text-muted-foreground bg-background/8 hover:bg-accent/12 backdrop-blur-[4px] !pointer-events-auto"
              variant="outline"
              onClick={() => {
                toast.success("Thanks for the feedback!");
              }}
            >
              <ThumbsUpIcon size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-downvote"
              className="py-1 px-2 h-fit text-muted-foreground bg-background/8 hover:bg-accent/12 backdrop-blur-[4px] !pointer-events-auto"
              variant="outline"
              onClick={() => {
                toast.success("Thanks for the feedback!");
              }}
            >
              <ThumbsDownIcon size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote Response</TooltipContent>
        </Tooltip> */}
      </div>
    </TooltipProvider>
  );
};

export const MessageActions = memo(PureMessageActions, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;

  return true;
});

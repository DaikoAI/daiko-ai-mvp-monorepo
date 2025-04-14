"use client";

import { cn } from "@/utils";
import type { UIMessage } from "ai";
import type { UseChatHelpers } from "ai/react";
import { AnimatePresence, motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";
import { memo } from "react";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";

interface PreviewMessageProps {
  threadId: string;
  message: UIMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
}

const PurePreviewMessage: React.FC<PreviewMessageProps> = ({
  threadId,
  message,
  isLoading,
  isReadonly,
  setMessages,
  reload,
}: {
  threadId: string;
  message: UIMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
}) => {
  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            {
              "w-full": true,
              "group-data-[role=user]/message:w-fit": message.role === "user",
            },
          )}
        >
          {message.role === "assistant" && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon className="size-4" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === "text") {
                const text = typeof part.text === "string" ? part.text : message.content || "";
                return (
                  <div key={key} className="flex flex-row gap-2 items-start">
                    <div
                      data-testid="message-content"
                      className={cn("flex flex-col gap-4", {
                        "bg-primary text-primary-foreground px-3 py-2 rounded-xl ml-auto": message.role === "user",
                      })}
                    >
                      <Markdown>{text}</Markdown>
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {!isReadonly && (
            <MessageActions key={`action-${message.id}`} threadId={threadId} message={message} isLoading={isLoading} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(PurePreviewMessage);

export const ThinkingMessage: React.FC = () => {
  const role = "assistant";

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div className="flex gap-4 w-full">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon className="size-4" />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">Hmm...</div>
        </div>
      </div>
    </motion.div>
  );
};

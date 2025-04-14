"use client";

import { cn } from "@/utils";
import type { UIMessage } from "ai";
import type { UseChatHelpers } from "ai/react";
import { AnimatePresence, motion } from "framer-motion";
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
        className={cn("w-full mx-auto max-w-3xl px-3 py-3 group/message", {
          "flex justify-end": message.role === "user",
        })}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn("flex gap-4 rounded-2xl backdrop-blur-[4px]", {
            "bg-white/12 w-full p-3": message.role === "assistant",
            "bg-white/24 max-w-2xl py-2 px-3": message.role === "user",
          })}
        >
          <div className="flex flex-col gap-4 w-full">
            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === "text") {
                const text = typeof part.text === "string" ? part.text : message.content || "";
                return (
                  <div key={key} className="flex flex-row gap-2 items-start">
                    <div className="flex flex-col gap-4 text-[14px] leading-[1.286] font-normal text-white">
                      <Markdown>{text}</Markdown>
                    </div>
                  </div>
                );
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                threadId={threadId}
                message={message}
                isLoading={isLoading}
              />
            )}
          </div>
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
      className="w-full mx-auto max-w-3xl px-3 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div className="flex gap-4 w-full rounded-2xl backdrop-blur-[4px] p-4 bg-white/12">
        <div className="flex flex-col gap-2 w-full animate-pulse">
          <div className="flex flex-col gap-4 text-white/40">Hmm...</div>
        </div>
      </div>
    </motion.div>
  );
};

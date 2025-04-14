"use client";

import type { RouterOutputs } from "@/trpc/react";
import { generateUUID } from "@/utils";
import { useChat } from "@ai-sdk/react";
import type { Attachment, UIMessage } from "ai";
import { useState } from "react";
import { toast } from "sonner";
import { ChatHeader } from "./chat-header";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

interface ChatProps {
  thread: RouterOutputs["chat"]["getThread"];
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  isReadonly: boolean;
}

export const Chat: React.FC<ChatProps> = ({ thread, initialMessages, selectedChatModel, isReadonly }: ChatProps) => {
  const { messages, setMessages, handleSubmit, input, setInput, append, status, stop, reload } = useChat({
    id: thread.id,
    body: { id: thread.id, selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onError: (error) => {
      console.error(error);
      toast.error("An error occurred, please try again!");
    },
  });

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-[#080808] relative">
      <ChatHeader title={thread.title} />

      <Messages
        threadId={thread.id}
        status={status}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
      />

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-[64px] border-t border-white/10 flex flex-col gap-3 rounded-t-2xl"
        >
          {!isReadonly && (
            <MultimodalInput
              threadId={thread.id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>
    </div>
  );
};

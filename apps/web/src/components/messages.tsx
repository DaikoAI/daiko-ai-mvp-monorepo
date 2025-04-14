import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import type { UIMessage } from "ai";
import type { UseChatHelpers } from "ai/react";
import { PreviewMessage, ThinkingMessage } from "./message";

interface MessagesProps {
  threadId: string;
  messages: UIMessage[];
  setMessages: UseChatHelpers["setMessages"];
  status: string;
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
}

export const Messages: React.FC<MessagesProps> = ({
  threadId,
  messages,
  setMessages,
  status,
  reload,
  isReadonly,
}: MessagesProps) => {
  const [containerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();

  return (
    <div className="flex-1 overflow-y-auto" ref={containerRef}>
      {messages.map((message) => (
        <PreviewMessage
          key={message.id}
          threadId={threadId}
          message={message}
          isLoading={status === "in_progress"}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      {status === "in_progress" && <ThinkingMessage />}

      <div ref={messagesEndRef} />
    </div>
  );
};

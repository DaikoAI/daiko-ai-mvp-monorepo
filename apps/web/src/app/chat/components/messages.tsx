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
    <div className="flex-1 overflow-y-auto pb-36 pt-2 overscroll-contain" ref={containerRef}>
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          threadId={threadId}
          message={message}
          isLoading={status === "streaming" && messages.length - 1 === index}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      {status === "submitted" && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
        <ThinkingMessage />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

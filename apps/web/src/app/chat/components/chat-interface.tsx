"use client";

import { Button } from "@/components/ui/button";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";
import type { ApiChatMessage } from "@/types/chat";
import { cn } from "@/utils";
import { setIdleTask } from "idle-task";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface ChatInterfaceProps {
  thread: RouterOutputs["chat"]["getThread"];
  initialMessage?: string;
}

interface PendingMessage {
  id: string;
  content: string;
  role: "assistant";
  isStreaming: boolean;
}

interface Message {
  id: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ thread, initialMessage }) => {
  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = api.chat.getMessages.useQuery(
    {
      threadId: thread.id,
    },
    {
      // メッセージの自動更新を無効化（手動で制御）
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  const trpc = api.useUtils();

  const { mutate: sendMessage, isPending: isSending } = api.chat.sendMessage.useMutation({
    onMutate: async (newMessage) => {
      const prevMessages = trpc.chat.getMessages.getData({ threadId: thread.id });

      // Optimistically update the cache
      trpc.chat.getMessages.setData({ threadId: thread.id }, (old) => {
        if (!old) return [newMessage as Message];
        return [...old, newMessage as Message];
      });

      return { prevMessages };
    },
    onError: (err, newMessage, context) => {
      if (context?.prevMessages) {
        trpc.chat.getMessages.setData({ threadId: thread.id }, context.prevMessages);
      }
    },
    onSettled: () => {
      // キャッシュの再検証を遅延させる
      setTimeout(() => {
        trpc.chat.getMessages.invalidate({ threadId: thread.id });
      }, 100);
    },
  });

  const { mutate: summarizeAndUpdateTitle } = api.chat.summarizeAndUpdateThreadTitle.useMutation({
    onError: (error) => {
      console.error("Title summarization failed:", error);
    },
    onSuccess: (data) => {
      if (data.success && data.updated) {
        console.log("Thread title successfully updated to:", data.title);
      } else if (data.success && !data.updated) {
        console.log("Title summarization skipped (e.g., custom title already set).");
      }
    },
  });

  const [inputValue, setInputValue] = useState(initialMessage || "");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [pendingAiMessage, setPendingAiMessage] = useState<PendingMessage | null>(null);
  const [titleSummarizationScheduled, setTitleSummarizationScheduled] = useState(false);
  const [shouldPreventScroll, setShouldPreventScroll] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current && !shouldPreventScroll) {
      const container = messagesContainerRef.current;
      const endElement = messagesEndRef.current;

      if (container) {
        const containerHeight = container.clientHeight;
        const scrollPosition = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const isNearBottom = scrollHeight - (scrollPosition + containerHeight) < 100;

        // Only scroll if we're already near the bottom or it's a forced scroll
        if (isNearBottom || behavior === "instant") {
          endElement.scrollIntoView({ behavior, block: "end" });
        }
      }
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (pendingAiMessage?.isStreaming) {
      scrollToBottom("smooth");
    }
  }, [pendingAiMessage?.content]);

  // Handle DB updates
  useEffect(() => {
    if (!pendingAiMessage && messages?.length) {
      // Set a brief pause before allowing scrolling again
      setShouldPreventScroll(true);
      const timer = setTimeout(() => {
        setShouldPreventScroll(false);
        scrollToBottom("instant");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages?.length, pendingAiMessage]);

  // Ensure immediate scroll on first load
  useEffect(() => {
    if (messages && !pendingAiMessage) {
      scrollToBottom("instant");
    }
  }, []);

  // Effect to schedule title summarization using idle-task
  useEffect(() => {
    // Schedule summarization only if:
    // 1. threadId exists
    // 2. There are at least 3 messages (e.g., User, AI, User/AI)
    // 3. Summarization hasn't been scheduled yet for this thread instance
    if (thread.id && messages && messages.length >= 3 && !titleSummarizationScheduled && thread.title === "New Chat") {
      console.log("Scheduling title summarization for thread:", thread.id);

      // Define the task function that calls the backend mutation
      const summarizeTask = () => {
        console.log("Running title summarization task for thread:", thread.id);
        summarizeAndUpdateTitle({ threadId: thread.id });
      };

      // Schedule the task to run when the browser is idle
      setIdleTask(summarizeTask, { priority: "low" });

      // Mark summarization as scheduled to prevent rescheduling in this component instance
      setTitleSummarizationScheduled(true);
    }
  }, [messages, thread.id, titleSummarizationScheduled, summarizeAndUpdateTitle]);

  // クライアント側でチャットAPIを呼び出す関数
  const chatWithAI = async (messages: ApiChatMessage[], onUpdate?: (text: string) => void) => {
    try {
      // APIリクエストを準備
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error("APIリクエストが失敗しました");
      }

      // ストリーミングレスポンスを処理
      const reader = response.body?.getReader();
      if (!reader) throw new Error("レスポンスボディを取得できませんでした");

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      // ストリーミングで読み取り
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // チャンクをデコード
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        // コールバック関数が提供されている場合は呼び出す
        if (onUpdate) {
          onUpdate(accumulatedContent);
        }
      }

      return { content: accumulatedContent };
    } catch (error) {
      console.error("チャットAPIエラー:", error);
      return {
        content: "",
        error: error instanceof Error ? error.message : "不明なエラーが発生しました",
      };
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() || isAiTyping) return;

    setInputValue("");
    setIsAiTyping(true);
    scrollToBottom("instant");

    try {
      // Send user message
      await sendMessage({
        content: textToSend,
        role: "user",
        threadId: thread.id,
      });

      // Prepare messages for AI
      const currentMessages = messages ?? [];
      const apiMessages: ApiChatMessage[] = [...currentMessages, { content: textToSend, role: "user" as const }].map(
        ({ content, role }) => ({
          content,
          role,
        }),
      );

      // Create pending AI message
      const pendingId = `pending-${Date.now()}`;
      setPendingAiMessage({
        id: pendingId,
        content: "",
        role: "assistant",
        isStreaming: true,
      });

      // Get AI response with streaming
      const result = await chatWithAI(apiMessages, (streamContent) => {
        setPendingAiMessage(
          (prev) =>
            prev && {
              ...prev,
              content: streamContent,
              isStreaming: true,
            },
        );
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Update pending message with final content
      setPendingAiMessage(
        (prev) =>
          prev && {
            ...prev,
            content: result.content,
            isStreaming: false,
          },
      );

      // Send AI response to backend and ensure smooth transition
      await sendMessage({
        content: result.content,
        role: "assistant",
        threadId: thread.id,
      });

      // Wait for the cache update before clearing pending message
      await new Promise((resolve) => setTimeout(resolve, 200));
      setPendingAiMessage(null);
    } catch (error) {
      console.error("APIエラー:", error);
      setShouldPreventScroll(true);
      await sendMessage({
        content: "申し訳ありません、エラーが発生しました。もう一度お試しください。",
        role: "assistant",
        threadId: thread.id,
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // メッセージコンポーネントを作成
  const MessageContent: React.FC<{ content: string; isMarkdown?: boolean }> = ({ content, isMarkdown = false }) => {
    if (!isMarkdown) {
      return <p className="whitespace-pre-line">{content}</p>;
    }

    return <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>{content}</ReactMarkdown>;
  };

  // 安全な日時フォーマット関数
  const formatTime = (date: Date | undefined) => {
    if (!date) return "";
    try {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-[#080808]">
      {/* Messages container - takes all available space and scrolls */}
      <div
        className="absolute inset-0 bottom-16 overflow-y-auto touch-auto no-scrollbar"
        ref={messagesContainerRef}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {isMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex space-x-2">
              <div className="h-3 w-3 rounded-full bg-white/40 animate-bounce"></div>
              <div className="h-3 w-3 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]"></div>
              <div className="h-3 w-3 rounded-full bg-white/40 animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        ) : messagesError ? (
          <div className="flex items-center justify-center h-full text-red-500">
            <p>メッセージの読み込みに失敗しました。再読み込みしてください。</p>
          </div>
        ) : (
          <div className="py-3 flex flex-col gap-3">
            {/* Left padding for AI messages: 36px, right padding: 12px */}
            {/* Right padding for user messages: 36px, left padding: 12px */}
            {messages?.map((message) => (
              <div
                key={`message-${message.id}`}
                className={cn(
                  "flex max-w-[80%] flex-col",
                  message.role === "user" ? "ml-auto pr-[8px] pl-[12px]" : "pr-[12px] pl-[8px]",
                )}
              >
                <div className="rounded-2xl p-4 backdrop-blur-[4px] bg-white/12">
                  <div className="space-y-2">
                    {message.role === "assistant" && (
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1.5">{/* Icons would go here */}</div>
                        <span
                          className="text-sm text-white/40"
                          style={{ fontFamily: "Inter", fontWeight: 400, lineHeight: "1.286em" }}
                        >
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className="text-white"
                      style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "14px", lineHeight: "1.286em" }}
                    >
                      <MessageContent content={message.content} isMarkdown={message.role === "assistant"} />
                    </div>
                    {message.role === "user" && (
                      <div className="flex justify-end">
                        <span
                          className="text-sm text-white/40"
                          style={{ fontFamily: "Inter", fontWeight: 400, lineHeight: "1.286em" }}
                        >
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pending AI Message */}
            {pendingAiMessage && (
              <div key={`pending-${pendingAiMessage.id}`} className="flex max-w-[80%] pl-[8px] pr-[12px]">
                <div className="w-full rounded-2xl p-4 bg-white/12 backdrop-blur-[4px]">
                  <div className="text-white">
                    <MessageContent content={pendingAiMessage.content} isMarkdown={true} />
                  </div>
                  {pendingAiMessage.isStreaming && (
                    <div className="flex space-x-1 mt-2">
                      <div className="h-2 w-2 rounded-full bg-white/40 animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-[64px] border-t border-white/10 z-10 rounded-t-2xl pb-safe">
        <div className="flex items-center px-5 py-3 gap-2">
          <div className="relative flex-1">
            <textarea
              placeholder="Type any text."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-resize the textarea
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKeyDown}
              className="w-full resize-none bg-transparent px-3 py-2 text-white placeholder:text-white/40 focus:outline-none no-scrollbar"
              style={{
                minHeight: "24px",
                maxHeight: "100px",
                overflowY: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                fontFamily: "Inter",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "1.286em",
              }}
              rows={1}
              disabled={isAiTyping || isSending || isMessagesLoading}
            />
          </div>
          <Button
            size="icon"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isAiTyping || isSending || isMessagesLoading}
            className="h-6 w-6 rounded-full bg-white hover:bg-white/90 flex items-center justify-center"
          >
            <ArrowUp className="h-4 w-4 text-black" />
          </Button>
        </div>
      </div>
    </div>
  );
};

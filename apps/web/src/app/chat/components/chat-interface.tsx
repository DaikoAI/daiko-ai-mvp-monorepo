"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { ApiChatMessage, ChatMessage } from "@/types/chat";
import { cn } from "@/utils";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { setIdleTask } from "idle-task";

export const ChatInterface: React.FC<{ initialMessages: ChatMessage[]; threadId: string; threadTitle?: string }> = ({
  initialMessages,
  threadId,
  threadTitle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [pendingMessage, setPendingMessage] = useState("");
  const [titleSummarizationScheduled, setTitleSummarizationScheduled] = useState(false);

  const { mutate: sendMessage } = api.chat.sendMessage.useMutation();
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, pendingMessage]);

  // Effect to schedule title summarization using idle-task
  useEffect(() => {
    // Schedule summarization only if:
    // 1. threadId exists
    // 2. There are at least 3 messages (e.g., User, AI, User/AI)
    // 3. Summarization hasn't been scheduled yet for this thread instance
    if (threadId && messages.length >= 3 && !titleSummarizationScheduled && threadTitle === "New Chat") {
      console.log("Scheduling title summarization for thread:", threadId);

      // Define the task function that calls the backend mutation
      const summarizeTask = () => {
        console.log("Running title summarization task for thread:", threadId);
        summarizeAndUpdateTitle({ threadId });
      };

      // Schedule the task to run when the browser is idle
      setIdleTask(summarizeTask, { priority: "low" });

      // Mark summarization as scheduled to prevent rescheduling in this component instance
      setTitleSummarizationScheduled(true);
    }
  }, [messages, threadId, titleSummarizationScheduled, summarizeAndUpdateTitle]);

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

    // Add user message
    // TODO: associate message with threadId if it exists
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: textToSend,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsAiTyping(true);
    setPendingMessage("");

    sendMessage({
      content: textToSend,
      role: "user",
      threadId,
    });

    try {
      // メッセージをAPI形式に変換
      const apiMessages: ApiChatMessage[] = [...messages, newUserMessage].map(({ content, role }) => ({
        content,
        role,
      }));

      // ローカルに実装したチャット関数を使用
      const result = await chatWithAI(apiMessages, (streamContent) => {
        // ストリーミング更新時のコールバック
        setPendingMessage(streamContent);
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // ストリーミングが完了したらメッセージリストに追加
      // TODO: associate message with threadId if it exists
      const newAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: result.content,
        role: "assistant",
        timestamp: new Date(),
      };

      sendMessage({
        content: result.content,
        role: "assistant",
        threadId,
      });

      setMessages((prev) => [...prev, newAiMessage]);
    } catch (error) {
      console.error("APIエラー:", error);
      // エラーメッセージを表示
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "申し訳ありません、エラーが発生しました。もう一度お試しください。",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
      setPendingMessage("");
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

  return (
    <div className="relative flex flex-col h-full bg-[#080808]">
      {/* Messages container - takes all available space and scrolls */}
      <div
        className="absolute inset-0 bottom-16 overflow-y-auto touch-auto no-scrollbar"
        ref={messagesContainerRef}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="py-3 flex flex-col gap-3">
          {/* Left padding for AI messages: 36px, right padding: 12px */}
          {/* Right padding for user messages: 36px, left padding: 12px */}
          {messages.map((message) => (
            <div
              key={message.id}
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
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* ストリーミング中のメッセージを表示 */}
          {pendingMessage && (
            <div className="flex max-w-[80%] pl-[36px] pr-[12px]">
              <div className="w-full rounded-2xl p-4 bg-white/12 backdrop-blur-[4px]">
                <div
                  className="text-white"
                  style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "14px", lineHeight: "1.286em" }}
                >
                  <MessageContent content={pendingMessage} isMarkdown={true} />
                </div>
              </div>
            </div>
          )}

          {/* AIの入力中表示 */}
          {isAiTyping && !pendingMessage && (
            <div className="flex max-w-[80%] pl-[36px] pr-[12px]">
              <div className="w-full rounded-2xl p-4 bg-white/12 backdrop-blur-[4px]">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-white/40"></div>
                  <div className="h-2 w-2 rounded-full bg-white/40"></div>
                  <div className="h-2 w-2 rounded-full bg-white/40"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
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
              disabled={isAiTyping}
            />
          </div>
          <Button
            size="icon"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isAiTyping}
            className="h-6 w-6 rounded-full bg-white hover:bg-white/90 flex items-center justify-center"
          >
            <ArrowUp className="h-4 w-4 text-black" />
          </Button>
        </div>
      </div>
    </div>
  );
};

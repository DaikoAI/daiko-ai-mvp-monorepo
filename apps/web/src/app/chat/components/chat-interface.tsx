"use client";

import { Button } from "@/components/ui/button";
import { ApiChatMessage, ChatMessage } from "@/types/chat";
import { cn, createNoScrollbarStyle } from "@/utils";
import { Send } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

// Create a component that uses question prop instead of useSearchParams
const ChatWithParams: React.FC<{ question?: string }> = ({ question }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hello! I'm your AI crypto assistant. How can I help with your portfolio today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [pendingMessage, setPendingMessage] = useState("");
  // 初期質問が既に処理されたかどうかを追跡
  const initialQuestionProcessedRef = useRef(false);

  // スクロールバーを非表示にするスタイルを適用
  useEffect(() => {
    createNoScrollbarStyle();
  }, []);

  // Handle initial question from prop - 一度だけ実行するように変更
  useEffect(() => {
    if (question && !initialQuestionProcessedRef.current) {
      initialQuestionProcessedRef.current = true;
      setInputValue(question);
      handleSendMessage(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, pendingMessage]);

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
      const newAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: result.content,
        role: "assistant",
        timestamp: new Date(),
      };

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
    <div className="relative flex flex-col h-full">
      {/* Messages container - takes all available space and scrolls */}
      <div
        className="absolute inset-0 bottom-16 overflow-y-auto touch-auto no-scrollbar"
        ref={messagesContainerRef}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="space-y-4 p-4 pb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex max-w-[80%] flex-col rounded-lg p-3",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              <MessageContent content={message.content} isMarkdown={message.role === "assistant"} />
              <span className="mt-1 self-end text-xs opacity-70">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}

          {/* ストリーミング中のメッセージを表示 */}
          {pendingMessage && (
            <div className="flex max-w-[80%] flex-col rounded-lg p-3 bg-secondary text-secondary-foreground">
              <MessageContent content={pendingMessage} isMarkdown={true} />
            </div>
          )}

          {/* AIの入力中表示 */}
          {isAiTyping && !pendingMessage && (
            <div className="flex max-w-[80%] animate-pulse rounded-lg bg-secondary p-3">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-background pt-3 px-4 z-10">
        <div className="flex items-start space-x-2">
          <div className="relative flex-1">
            <textarea
              placeholder="Ask about your portfolio..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-resize the textarea
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 no-scrollbar"
              style={{
                minHeight: "36px",
                maxHeight: "100px",
                overflowY: "auto",
                scrollbarWidth: "none" /* Firefox */,
                msOverflowStyle: "none" /* IE and Edge */,
                WebkitOverflowScrolling: "touch",
              }}
              rows={1}
              disabled={isAiTyping}
            />
          </div>
          <Button
            size="icon"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isAiTyping}
            className="h-9 w-9 rounded-full bg-primary mt-0.5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main component that wraps the chat with Suspense
export const ChatInterface: React.FC<{ question?: string }> = ({ question }) => {
  return (
    <Suspense fallback={<div className="p-4">Loading chat interface...</div>}>
      <ChatWithParams question={question} />
    </Suspense>
  );
};

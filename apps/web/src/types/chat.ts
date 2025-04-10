/**
 * メッセージの送信者/ロールの型
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * チャットメッセージの型
 */
export type ChatMessage = {
  id: string;
  content: string;
  role: MessageRole;
  createdAt: Date;
};

/**
 * API通信用のメッセージの型
 */
export type ApiChatMessage = {
  content: string;
  role: MessageRole;
};

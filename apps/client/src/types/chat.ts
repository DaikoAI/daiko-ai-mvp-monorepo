/**
 * メッセージの送信者/ロールの型
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * チャットメッセージの型
 */
export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
}

/**
 * API通信用のメッセージの型
 */
export interface ApiChatMessage {
  content: string;
  role: MessageRole;
}

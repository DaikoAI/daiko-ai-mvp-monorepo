import { ChatOpenAI } from "@langchain/openai";

export const defaultSignalChatModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.1,
  maxTokens: 1500,
});

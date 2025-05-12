import { ChatOpenAI, type OpenAIInput } from "@langchain/openai";

/**
 * Factory for creating a ChatOpenAI instance for signal detection.
 * Allows overriding default model parameters.
 *
 * @param overrides Partial parameters to override the defaults.
 * @returns ChatOpenAI model instance.
 */
export function createSignalChatModel(overrides?: Partial<OpenAIInput>): ChatOpenAI {
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.1,
    maxTokens: 1500,
    ...overrides,
  });
}

/**
 * Default ChatOpenAI model for signal detection.
 */
export const defaultSignalChatModel = createSignalChatModel();

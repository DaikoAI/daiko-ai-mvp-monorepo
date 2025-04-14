export const DEFAULT_CHAT_MODEL = "gpt-4-turbo-preview";

export const CHAT_MODELS = [
  {
    id: "gpt-4-turbo-preview",
    name: "GPT-4 Turbo",
    description: "Most capable model, best for complex tasks",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and cost-effective for simpler tasks",
  },
] as const;

export type ChatModel = (typeof CHAT_MODELS)[number]["id"];

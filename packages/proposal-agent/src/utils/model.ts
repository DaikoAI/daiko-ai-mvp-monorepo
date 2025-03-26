import { ChatOpenAI } from "@langchain/openai";

export const gpt4o = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
});

export const gpt4oMini = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
});

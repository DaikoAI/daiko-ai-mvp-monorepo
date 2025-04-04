"use server";

import { env } from "@/env";
import type { ApiChatMessage } from "@/types/chat";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// OpenAIクライアントインスタンスを作成
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * OpenAI APIを利用してチャットメッセージを送信し、ストリーミングレスポンスを返すServer Action
 *
 * @param messages APIメッセージ配列
 * @returns ストリーミングレスポンス
 */
export async function getChatCompletionStream(messages: ApiChatMessage[]) {
  try {
    // メッセージをOpenAI形式に変換
    const openAiMessages: ChatCompletionMessageParam[] = messages.map(({ content, role }) => ({
      content,
      role,
    }));

    // OpenAI APIを呼び出し、ストリーミングレスポンスを取得
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: openAiMessages,
      stream: true,
    });

    // ReadableStreamを作成して返す
    const stream = new ReadableStream({
      async start(controller) {
        // ストリーミングレスポンスを処理
        for await (const chunk of response) {
          // チャンクから内容を取得
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }

        controller.close();
      },
    });

    // ストリーミングレスポンスを返す
    return new Response(stream);
  } catch (error) {
    console.error("OpenAI APIエラー:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "不明なエラーが発生しました",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * OpenAI APIを利用してチャットメッセージを送信するServer Action
 *
 * @param messages 送信するメッセージ配列
 * @returns レスポンスを含むオブジェクト
 */
export async function sendChatMessage(messages: ApiChatMessage[]) {
  try {
    // APIリクエストを準備
    const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error("APIリクエストが失敗しました");
    }

    // レスポンステキストを取得
    const text = await response.text();
    return { content: text };
  } catch (error) {
    console.error("API エラー:", error);
    return {
      content: "",
      error: error instanceof Error ? error.message : "不明なエラーが発生しました",
    };
  }
}

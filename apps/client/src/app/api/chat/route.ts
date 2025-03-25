import { getChatCompletionStream } from "@/lib/openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "メッセージが正しい形式で提供されていません" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // lib/openaiの関数を使用してストリーミングレスポンスを取得
    return getChatCompletionStream(messages);
  } catch (error) {
    console.error("API エラー:", error);
    return new Response(JSON.stringify({ error: "リクエスト処理中にエラーが発生しました" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

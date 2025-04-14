import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { generateUUID } from "@/utils";
import { openai } from "@ai-sdk/openai";
import { type UIMessage, createDataStreamResponse, smoothStream, streamText } from "ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { id, messages, selectedChatModel }: { id: string; messages: Array<UIMessage>; selectedChatModel: string } =
      await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== "user") {
      return new Response("No user message found", { status: 400 });
    }

    // Save message to database
    await api.chat.createMessage({
      id: generateUUID(),
      threadId: id,
      role: userMessage.role,
      parts: userMessage.parts,
      attachments: userMessage.experimental_attachments ?? [],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: openai(DEFAULT_CHAT_MODEL),
          messages,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: "word" }),
          experimental_generateMessageId: generateUUID,
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantMessage = response.messages[response.messages.length - 1] as UIMessage;
                if (!assistantMessage || assistantMessage.role !== "assistant") {
                  throw new Error("No assistant message found!");
                }

                await api.chat.createMessage({
                  id: assistantMessage.id,
                  threadId: id,
                  role: assistantMessage.role,
                  parts: assistantMessage.parts,
                  attachments: assistantMessage.experimental_attachments ?? [],
                });
              } catch (error) {
                console.error("Failed to save chat", error);
              }
            }
          },
        });

        result.consumeStream();
        result.mergeIntoDataStream(dataStream);
      },
      onError: () => {
        return "申し訳ありません。エラーが発生しました。";
      },
    });
  } catch (error) {
    console.error("API エラー:", error);
    return new Response("リクエスト処理中にエラーが発生しました", { status: 500 });
  }
}

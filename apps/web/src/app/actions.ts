"use server";

import { myProvider } from "@/lib/ai/provider";
import { generateText, Message } from "ai";
import { revalidatePath } from "next/cache";

// チャット関連の再検証
export async function revalidateChatList() {
  revalidatePath("/chat");
}

export async function revalidateThread(threadId: string) {
  revalidatePath(`/chat/${threadId}`);
}

// ポートフォリオ関連の再検証
export async function revalidatePortfolio(publicKey?: string) {
  if (publicKey) {
    revalidatePath(`/portfolio/${publicKey}`);
  } else {
    revalidatePath("/portfolio");
  }
}

// 全体のポートフォリオページの再検証
export async function revalidateAllPortfolios() {
  revalidatePath("/portfolio");
}

export async function revalidateProfile() {
  revalidatePath("/profile");
}

export async function generateTitleFromUserMessage({ message }: { message: Message }) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

"use server";

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

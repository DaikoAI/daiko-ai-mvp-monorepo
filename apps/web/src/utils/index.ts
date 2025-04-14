import type { ApplicationError } from "@/types";
import { Keypair } from "@solana/web3.js";
import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind CSS classes and resolves conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 4): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + "M";
  }

  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + "K";
  }

  return value.toFixed(decimals);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatAddress(address: string): string {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatPrice(price?: number): string {
  if (price === undefined || price === null) return "$0.00";
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Solanaのウォレットアドレスを生成する関数
 * @returns ランダムに生成されたSolanaウォレットアドレス
 */
export function generateSolanaWalletAddress(): string {
  // 新しいKeypairを生成
  const keypair = Keypair.generate();
  // 公開鍵（ウォレットアドレス）を文字列として返す
  return keypair.publicKey.toString();
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.") as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function smoothStream(text: string): string {
  return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

export function createDataStreamResponse(stream: AsyncIterable<string>) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    },
  );
}

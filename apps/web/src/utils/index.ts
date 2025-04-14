import { Keypair } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
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

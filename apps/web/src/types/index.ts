import type { UIMessage } from "ai";

// src/types/portfolio.ts

// 共通のインターフェース・タイプ
export type TokenInterface = "FungibleToken" | "ProgrammableNFT" | "NFT";

export interface File {
  uri: string;
  cdn_uri: string;
  mime: string;
}

export interface Metadata {
  description?: string;
  name: string;
  symbol?: string;
  token_standard?: string;
  attributes?: Array<{
    value: string | number;
    trait_type: string;
  }>;
}

export interface Links {
  image: string;
  external_url?: string;
}

export interface Content {
  $schema?: string;
  json_uri: string;
  files: File[];
  metadata: Metadata;
  links: Links;
}

export interface Authority {
  address: string;
  scopes: string[];
}

export interface Compression {
  eligible: boolean;
  compressed: boolean;
  data_hash: string;
  creator_hash: string;
  asset_hash: string;
  tree: string;
  seq: number;
  leaf_id: number;
}

export interface Royalty {
  royalty_model: string;
  target: null | string;
  percent: number;
  basis_points: number;
  primary_sale_happened: boolean;
  locked: boolean;
}

export interface Creator {
  address: string;
  share: number;
  verified: boolean;
}

export interface Ownership {
  frozen: boolean;
  delegated: boolean;
  delegate: null | string;
  ownership_model: "token" | "single";
  owner: string;
}

export interface Supply {
  print_max_supply?: number;
  print_current_supply?: number;
  edition_nonce?: number;
}

export interface TokenAccount {
  address: string;
  balance: number;
}

export interface PriceInfo {
  price_per_token: number;
  total_price: number;
  currency: string;
}

export interface TokenInfo {
  token_accounts: TokenAccount[];
  symbol: string;
  balance: number;
  supply: number;
  decimals: number;
  token_program: string;
  associated_token_address: string;
  price_info?: PriceInfo;
  mint_authority?: string;
  freeze_authority?: string;
}

export interface CollectionMetadata {
  name: string;
  symbol: string;
  image: string;
  description: string;
  external_url: string;
}

export interface Grouping {
  group_key: string;
  group_value: string;
  collection_metadata?: CollectionMetadata;
}

// アセットの基本型
export interface BaseAsset {
  interface: TokenInterface;
  id: string;
  content: Content;
  authorities: Authority[];
  compression: Compression;
  grouping: Grouping[];
  royalty: Royalty;
  creators: Creator[];
  ownership: Ownership;
  supply: Supply | null;
  mutable: boolean;
  burnt: boolean;
  token_info: TokenInfo;
}

// 代替可能トークン (FT)
export interface FungibleToken extends BaseAsset {
  interface: "FungibleToken";
}

// プログラム可能なNFT (PNFT)
export interface ProgrammableNFT extends BaseAsset {
  interface: "ProgrammableNFT";
}

// ユニオン型でアセットを表現
export type Asset = FungibleToken | ProgrammableNFT;

// ポートフォリオの全アセット
export interface Portfolio {
  assets: Asset[];
  totalValue: number;
  walletAddress: string;
}

export type VisibilityType = "public" | "private";

export interface Message {
  id: string;
  threadId: string;
  userId: string;
  role: UIMessage["role"];
  parts: UIMessage["parts"];
  attachments?: Array<{
    url: string;
    name: string;
    contentType: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  threadId: string;
  messageId: string;
  userId: string;
  type: "up" | "down";
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationError extends Error {
  info: string;
  status: number;
}

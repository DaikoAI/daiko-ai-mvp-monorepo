export interface ScrapingTarget {
  type: "user" | "keyword";
  value: string | number; // FID or keyword
  limit?: number;
}

export interface ScrapingResult {
  success: boolean;
  error?: string;
  castsCount?: number;
}

// --- 型定義 ---
export interface SearchcasterCastBodyData {
  text: string;
  image: string | null;
  embeds: any[]; // 必要に応じて型定義
  replyParentMerkleRoot: string | null;
  threadMerkleRoot: string | null;
}

export interface SearchcasterCastBody {
  publishedAt: number;
  username: string;
  data: SearchcasterCastBodyData;
}

export interface SearchcasterCastMeta {
  displayName: string;
  avatar: string;
  isVerifiedAvatar: boolean;
  numReplyChildren: number;
  reactions: { count: number; type: string };
  recasts: { count: number };
  watches: { count: number };
  replyParentUsername: { fid: number | null; username: string | null };
  mentions: any[];
  tags: string[];
}

export interface SearchcasterCast {
  body: SearchcasterCastBody;
  meta: SearchcasterCastMeta;
  merkleRoot: string;
  uri: string;
}

export interface SearchcasterSearchResponse {
  casts: SearchcasterCast[];
  meta: { count: number; responseTime: number };
}

export type EngagementType = "reactions" | "recasts" | "replies" | "watches";

export type SearchcasterSearchOptions = {
  count?: number;
  engagement?: EngagementType;
  page?: number;
  media?: "image" | "music" | "youtube" | "url";
};

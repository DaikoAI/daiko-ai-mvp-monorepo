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

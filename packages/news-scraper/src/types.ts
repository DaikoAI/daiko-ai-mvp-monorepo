export interface NewsSite {
  id?: string;
  url: string;
  userId: string;
  lastCrawled?: string;
  title?: string;
  description?: string;
}

export interface ScrapeResult {
  id: string;
  siteId: string;
  url: string;
  content: string;
  timestamp: string;
}

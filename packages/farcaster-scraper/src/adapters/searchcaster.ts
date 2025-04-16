import pc from "picocolors";
import type { SearchcasterCast, SearchcasterSearchOptions, SearchcasterSearchResponse } from "../types";

export class SearchcasterAdapter {
  private readonly baseUrl = "https://searchcaster.xyz/api";

  /**
   * キーワードで検索
   */
  async searchByKeyword(text: string, options: SearchcasterSearchOptions = {}): Promise<SearchcasterCast[]> {
    return this._search({ ...options, text });
  }

  /**
   * ユーザー名で検索
   */
  async searchByUser(username: string, options: SearchcasterSearchOptions = {}): Promise<SearchcasterCast[]> {
    return this._search({ ...options, username });
  }

  /**
   * 内部: 任意のパラメータで検索
   */
  private async _search(params: Record<string, string | number | undefined>): Promise<SearchcasterCast[]> {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    const url = `${this.baseUrl}/search?${query}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(pc.red(`[ERROR] Searchcaster API failed: ${res.status} ${res.statusText}`));
        throw new Error(`Searchcaster API error: ${res.status}`);
      }
      const data: SearchcasterSearchResponse = await res.json();
      if (!Array.isArray(data.casts)) {
        console.error(pc.red(`[ERROR] Unexpected response format from Searchcaster`));
        throw new Error("Invalid response format");
      }
      const cond = params.text ? `keyword='${params.text}'` : params.username ? `username='${params.username}'` : "";
      console.log(pc.green(`[SUCCESS] Searchcaster: found ${data.casts.length} casts for ${cond}`));
      return data.casts;
    } catch (error: any) {
      console.error(pc.red(`[ERROR] Searchcaster search failed: ${error}`));
      throw error;
    }
  }
}

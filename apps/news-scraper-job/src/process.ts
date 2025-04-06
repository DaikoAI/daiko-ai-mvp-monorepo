import { NewsScraper, NewsScraperDB } from "@daiko-ai/news-scraper";
import "dotenv/config";

/**
 * ニュースサイトスクレイピング処理を実行するコア関数
 * どの環境からでも呼び出し可能な形式にしておく
 */
export async function processNewsScraping(options?: { specificSiteId?: string }): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const startTime = new Date();

  try {
    console.log(`[${startTime.toISOString()}] ニューススクレイピング処理を開始します`);

    // API KEYの取得
    const apiKey = process.env.FIRECRAWL_API_KEY || "";
    if (!apiKey) {
      return {
        success: false,
        message: "FIRECRAWL_API_KEY が設定されていません",
      };
    }

    // 必要なサービスのインスタンスを作成
    const db = new NewsScraperDB();
    const scraper = new NewsScraper(apiKey);

    // 特定のサイトのみスクレイピングする場合
    if (options?.specificSiteId) {
      // すべてのサイトを取得して、指定されたIDのサイトをフィルタリング
      const sites = await db.getNewsSites();
      const site = sites.find((s) => s.id === options.specificSiteId);

      if (!site) {
        return {
          success: false,
          message: `サイトID ${options.specificSiteId} が見つかりませんでした`,
        };
      }

      try {
        console.log(`サイト ${site.url} のスクレイピングを開始します`);
        const content = await scraper.scrapeSite(site);

        await db.saveScrapeResult({
          ...site,
          content: content,
          lastScraped: new Date(),
        });

        return {
          success: true,
          message: `サイト ${site.url} のスクレイピングが完了しました`,
          data: {
            siteId: site.id,
            url: site.url,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `サイト ${site.url} のスクレイピング中にエラーが発生しました`,
          data: { error: String(error) },
        };
      }
    }

    // 全サイトをスクレイピングする場合
    const sites = await db.getNewsSites();
    console.log(`${sites.length} サイトのスクレイピングを開始します`);

    if (sites.length === 0) {
      return {
        success: true,
        message: "スクレイピング対象のサイトがありません",
        data: { sites: 0 },
      };
    }

    const results = [];
    for (const site of sites) {
      try {
        console.log(`サイト ${site.url} のスクレイピングを開始します`);
        const content = await scraper.scrapeSite(site);

        if (site.id) {
          await db.saveScrapeResult({
            ...site,
            content: content,
            lastScraped: new Date(),
          });

          results.push({ siteId: site.id, status: "success" });
          console.log(`サイト ${site.url} のスクレイピングが完了しました`);
        }
      } catch (error) {
        console.error(`サイト ${site.id} のスクレイピング中にエラーが発生しました:`, error);
        results.push({ siteId: site.id, status: "error", message: String(error) });
      }
    }

    return {
      success: true,
      message: `${results.length} サイトのスクレイピングが完了しました`,
      data: { results },
    };
  } catch (error) {
    console.error("ニューススクレイピング処理中にエラーが発生しました:", error);
    return {
      success: false,
      message: "ニューススクレイピング処理中にエラーが発生しました",
      data: { error: String(error) },
    };
  } finally {
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    console.log(`[${endTime.toISOString()}] 処理完了 (${executionTime}ms)`);
  }
}

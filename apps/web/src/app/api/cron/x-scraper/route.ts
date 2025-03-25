import { XScraper } from "@daiko-ai/x-scraper";
import { NextResponse } from "next/server";

// Vercel Cron Jobから呼び出されるGETハンドラー
// Vercel.jsonで設定したスケジュールに従って実行される
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    console.log("Starting X (Twitter) scraping cron job...");

    // スクレイパーのインスタンスを作成
    const scraper = new XScraper();

    // 登録されているXアカウントをスクレイピング
    await scraper.checkXAccounts();

    console.log("X (Twitter) scraping completed successfully");

    return NextResponse.json({
      success: true,
      message: "X (Twitter) scraping completed successfully",
    });
  } catch (error) {
    console.error("Error in X scraper cron job:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

// Vercel Cron Job設定
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分（スクレイピングには時間がかかることがあるため）

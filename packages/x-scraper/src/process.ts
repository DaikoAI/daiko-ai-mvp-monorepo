import { XScraper } from "./scraper";

/**
 * X（Twitter）スクレイピング処理を実行するコア関数
 * どの環境からでも呼び出し可能な形式にしておく
 */
export async function processXScraping(options?: { specificAccountId?: string }): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const startTime = new Date();

  try {
    console.log(`[${startTime.toISOString()}] Xスクレイピング処理を開始します`);

    // スクレイパーのインスタンスを作成
    const credentials = {
      email: process.env.X_EMAIL!,
      password: process.env.X_PASSWORD!,
      username: process.env.X_USERNAME!,
    };
    const scraper = new XScraper(credentials);
    await scraper.login();

    // 特定のアカウントのみをスクレイピングする場合
    if (options?.specificAccountId) {
      console.log(`特定のXアカウント ${options.specificAccountId} のスクレイピングを開始します`);

      try {
        const result = await scraper.checkSingleAccount(options.specificAccountId);

        return {
          success: true,
          message: `Xアカウント ${options.specificAccountId} のスクレイピングが完了しました`,
          data: { accountId: options.specificAccountId, tweets: result?.length || 0 },
        };
      } catch (error) {
        return {
          success: false,
          message: `Xアカウント ${options.specificAccountId} のスクレイピング中にエラーが発生しました`,
          data: { error: String(error) },
        };
      }
    }

    // すべてのアカウントをスクレイピングする場合
    console.log(`登録されているすべてのXアカウントのスクレイピングを開始します`);
    await scraper.checkXAccounts();

    return {
      success: true,
      message: `すべてのXアカウントのスクレイピングが完了しました`,
    };
  } catch (error) {
    console.error("Xスクレイピング処理中にエラーが発生しました:", error);
    return {
      success: false,
      message: "Xスクレイピング処理中にエラーが発生しました",
      data: { error: String(error) },
    };
  } finally {
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    console.log(`[${endTime.toISOString()}] 処理完了 (${executionTime}ms)`);
  }
}

import { TokenPriceService } from "./services/token-price-service";

/**
 * トークン価格更新処理を実行するコア関数
 * どの環境からでも呼び出し可能な形式にしておく
 */
export async function processTokenPrices(options?: { specificTokenAddress?: string }): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const tokenPriceService = new TokenPriceService();
  const startTime = new Date();

  try {
    console.log(`[${startTime.toISOString()}] トークン価格更新処理を開始します`);

    // 特定のトークンの価格を取得する場合
    if (options?.specificTokenAddress) {
      console.log(`トークン ${options.specificTokenAddress} の価格を取得します`);
      const price = await tokenPriceService.getTokenPrice(options.specificTokenAddress);

      if (price) {
        return {
          success: true,
          message: `トークン ${options.specificTokenAddress} の価格取得に成功しました`,
          data: { tokenAddress: options.specificTokenAddress, price },
        };
      } else {
        return {
          success: false,
          message: `トークン ${options.specificTokenAddress} の価格取得に失敗しました`,
        };
      }
    }

    // すべてのトークンの価格を更新する場合
    await tokenPriceService.updateAllTokenPrices();

    return {
      success: true,
      message: "すべてのトークン価格の更新に成功しました",
    };
  } catch (error) {
    console.error("処理中にエラーが発生しました:", error);
    return {
      success: false,
      message: "処理中にエラーが発生しました",
      data: { error: String(error) },
    };
  } finally {
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    console.log(`[${endTime.toISOString()}] 処理完了 (${executionTime}ms)`);
  }
}

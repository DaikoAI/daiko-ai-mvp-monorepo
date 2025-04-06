import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { processXScraping } from "../process";

/**
 * AWS Lambda用のハンドラー関数
 * API Gatewayイベントを受け取り、処理結果を返却する
 */
export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  console.log("Lambda実行: イベント受信", JSON.stringify(event, null, 2));

  try {
    // クエリパラメータからアカウントIDを取得
    const specificAccountId = event.queryStringParameters?.accountId;

    // 処理実行
    const result = await processXScraping({
      specificAccountId,
    });

    // 結果を返却
    return {
      statusCode: result.success ? 200 : 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Lambda実行エラー:", error);

    // エラーを返却
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        message: "内部サーバーエラーが発生しました",
        error: String(error),
      }),
    };
  }
};

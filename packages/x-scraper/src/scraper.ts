import { createLogger } from "@daiko-ai/shared";
import { OpenAI } from "openai";
import { Builder, By, until, WebDriver } from "selenium-webdriver";
import { config } from "./config";
import { getAllXAccounts, saveChangeLog, saveNotificationLog, saveSystemLog, saveXAccount } from "./db";
import { ChangeLog, CryptoAnalysis, Tweet } from "./types";

export class XScraper {
  private openai: OpenAI;
  private driver: WebDriver | null = null;
  private logger = createLogger("XScraper");

  constructor() {
    // OpenAI APIクライアントを初期化
    this.openai = new OpenAI({
      apiKey: config.openAiApiKey,
    });
  }

  /**
   * Seleniumドライバーを初期化
   */
  private async initDriver(): Promise<WebDriver> {
    if (this.driver) {
      return this.driver;
    }

    this.logger.info("Initializing Selenium WebDriver");

    // WebDriverの作成
    this.driver = await new Builder().forBrowser("chrome").build();

    return this.driver;
  }

  /**
   * ドライバーをクローズ
   */
  public async closeDriver(): Promise<void> {
    if (this.driver) {
      this.logger.info("Closing WebDriver");
      await this.driver.quit();
      this.driver = null;
    }
  }

  /**
   * 登録されたすべてのXアカウントをチェック
   */
  public async checkXAccounts(): Promise<void> {
    try {
      this.logger.info("Starting to check all X accounts");

      const accounts = await getAllXAccounts();
      this.logger.info(`Found ${accounts.length} accounts to check`);

      if (accounts.length === 0) {
        this.logger.warn("No accounts to check");
        return;
      }

      for (const account of accounts) {
        if (!account.id) continue;

        try {
          await this.checkSingleAccount(account.id);
          // アカウント間で少し間隔を空ける（レート制限対策）
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
          this.logger.error(`Error checking account ${account.id}:`, { error });
        }
      }

      await saveSystemLog("Periodic X account check finished");
      this.logger.info("Finished checking all X accounts");
    } catch (error) {
      this.logger.error("Error checking X accounts:", { error });
      throw error;
    } finally {
      await this.closeDriver();
    }
  }

  /**
   * 単一のXアカウントをチェック
   */
  public async checkSingleAccount(xId: string): Promise<Tweet[] | null> {
    try {
      this.logger.info(`Checking X account: ${xId}`);

      const driver = await this.initDriver();
      const url = `https://x.com/${xId}`;

      // ページに移動
      this.logger.debug(`Navigating to ${url}`);
      await driver.get(url);

      // ページが読み込まれるのを待つ
      // X は「ツイート」セクションが表示されるのを待つ
      await driver.wait(until.elementLocated(By.css('article[data-testid="tweet"]')), 5000);

      // ツイートを抽出
      const tweets = await this.extractTweets(driver);
      this.logger.info(`Extracted ${tweets.length} tweets from ${xId}`);

      if (tweets.length === 0) {
        this.logger.warn(`No tweets found for ${xId}`);
        return null;
      }

      // アカウント情報を取得
      const accounts = await getAllXAccounts();
      const account = accounts.find((acc) => acc.id === xId);

      if (!account) {
        this.logger.error(`Account ${xId} not found in database`);
        return null;
      }

      const lastContent = account.lastContent || [];

      // 更新データを設定して保存
      account.lastContent = tweets;
      await saveXAccount(account);
      this.logger.info(`Updated account data for ${xId}`);

      // 変更があるかチェック
      if (lastContent.length === 0 || lastContent[0].data !== tweets[0].data) {
        this.logger.info(`Change detected for ${xId}`);

        // 変更ログを保存
        const changeLog: ChangeLog = {
          timestamp: new Date().toISOString(),
          xid: xId,
          content: tweets,
        };
        await saveChangeLog(changeLog);

        // 仮想通貨関連のコンテンツかチェックして通知
        await this.notifyUsers(xId, tweets);

        return tweets;
      } else {
        this.logger.info(`No change for ${xId}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error checking account ${xId}:`, { error });
      return null;
    }
  }

  /**
   * ドライバーからツイートを抽出
   */
  private async extractTweets(driver: WebDriver): Promise<Tweet[]> {
    const tweets: Tweet[] = [];

    try {
      // ツイート要素を取得
      const tweetElements = await driver.findElements(By.css('article[data-testid="tweet"]'));
      this.logger.debug(`Found ${tweetElements.length} tweet elements`);

      for (const element of tweetElements) {
        try {
          // タイムスタンプを持つ要素を探す
          const timeElement = await element.findElement(By.css("time"));
          const timestamp = await timeElement.getAttribute("datetime");

          // ツイートのテキストを取得
          const tweetTextElement = await element.findElement(By.css('div[data-testid="tweetText"]')).catch(() => null);

          let tweetText = "";
          if (tweetTextElement) {
            tweetText = await tweetTextElement.getText();
          } else {
            // ツイートテキストが見つからない場合、記事全体のテキストを取得
            tweetText = await element.getText();
          }

          // テキストが存在し、最小限の長さがある場合のみ追加
          if (tweetText && tweetText.length > 5) {
            tweets.push({
              time: timestamp,
              data: tweetText,
            });
          }
        } catch (error) {
          this.logger.error("Error extracting tweet data:", { error });
        }
      }
    } catch (error) {
      this.logger.error("Error finding tweet elements:", { error });
    }

    return tweets;
  }

  /**
   * コンテンツが仮想通貨関連かどうかをチェック
   */
  private async isCryptoRelated(content: string): Promise<CryptoAnalysis> {
    try {
      this.logger.info("Analyzing content for crypto relevance");

      const prompt = `
      以下のコンテンツが仮想通貨（暗号資産）の特定のコインと見られる情報に関連しているかどうかを判断してください:

      ${content}

      関連していない場合は「関連なし」と回答してください。
      ただの仮想通貨の情報であれば「関連なし」と回答してください。
      コンテンツが仮想通貨（暗号資産）の特定のコインと見られる情報に関連している場合は特定のコインの情報を含んでいるかも確認してください、コインの情報を含んでいる場合はそのコインの情報を解説してください。
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "あなたはコンテンツの分析を行う専門家です。",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 150,
      });

      const result = response.choices[0].message.content || "";
      this.logger.debug(`OpenAI analysis result: ${result}`);

      return {
        isCryptoRelated: !result.includes("関連なし"),
        analysisResult: result,
      };
    } catch (error) {
      this.logger.error("Error checking crypto relevance:", { error });
      return {
        isCryptoRelated: false,
        analysisResult: "Error analyzing content",
      };
    }
  }

  /**
   * ユーザーに通知
   */
  private async notifyUsers(xId: string, tweetData: Tweet[]): Promise<void> {
    try {
      this.logger.info(`Analyzing updates from ${xId} for notification`);

      // コンテンツが仮想通貨関連かどうかをチェック
      const analysis = await this.isCryptoRelated(JSON.stringify(tweetData));

      if (!analysis.isCryptoRelated) {
        this.logger.info(`Content is not crypto-related: ${xId}`);
        return;
      }

      this.logger.info(`Crypto-related content detected for ${xId}: ${analysis.analysisResult}`);

      // アカウントの登録ユーザーを取得
      const accounts = await getAllXAccounts();
      const account = accounts.find((acc) => acc.id === xId);

      if (!account || !account.userIds || account.userIds.length === 0) {
        this.logger.warn(`No users to notify for ${xId}`);
        return;
      }

      // 通知メッセージを作成
      const message = `
      ${xId}から仮想通貨関連の新しい投稿があります:

      ${tweetData[0].data}

      分析: ${analysis.analysisResult}
      `;

      // 通知ログを保存
      const notificationLog = {
        timestamp: new Date().toISOString(),
        accountId: xId,
        notifiedUsers: account.userIds,
        message: message,
      };

      await saveNotificationLog(notificationLog);
      this.logger.info(`Notification sent for ${xId} to ${account.userIds.length} users`);
    } catch (error) {
      this.logger.error(`Error notifying for ${xId}:`, { error });
    }
  }

  /**
   * アカウントを監視リストに追加
   */
  public async addAccount(xId: string, userId: string): Promise<boolean> {
    try {
      this.logger.info(`Adding/updating account ${xId} for user ${userId}`);

      // アカウントリストを取得
      const accounts = await getAllXAccounts();
      let account = accounts.find((acc) => acc.id === xId);

      if (account) {
        // 既存のアカウントを更新
        if (!account.userIds) {
          account.userIds = [];
        }

        if (!account.userIds.includes(userId)) {
          account.userIds.push(userId);
          this.logger.info(`Added user ${userId} to existing account ${xId}`);
        } else {
          this.logger.info(`User ${userId} already following account ${xId}`);
        }
      } else {
        // 新しいアカウントを作成
        account = {
          id: xId,
          userIds: [userId],
        };
        this.logger.info(`Created new account entry for ${xId}`);
      }

      // アカウントを保存
      await saveXAccount(account);

      // 初回チェックを実施
      await this.checkSingleAccount(xId);

      return true;
    } catch (error) {
      this.logger.error(`Error adding account ${xId}:`, { error });
      return false;
    }
  }
}

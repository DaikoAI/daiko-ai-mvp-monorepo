import { CryptoAnalysis, Logger, LogLevel, Tweet } from "@daiko-ai/shared";
import { execSync } from "child_process";
import { OpenAI } from "openai";
import { Browser, Builder, By, Key, until, WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { getAllXAccounts, saveTweets, saveXAccount } from "./db";

// Xアカウントのログイン情報の型定義
export interface XCredentials {
  email: string;
  password: string;
  username: string;
}

export class XScraper {
  private openai: OpenAI;
  private driver: WebDriver | null = null;
  private logger = new Logger({
    level: LogLevel.INFO,
  });
  private credentials: XCredentials | null = null;
  // static flag to ensure Chrome processes are cleaned up only once
  private static chromeCleaned = false;

  constructor(credentials?: XCredentials) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (credentials) {
      this.credentials = credentials;
    }
  }

  /**
   * Chromeプロセスをクリーンアップ
   */
  private cleanupChromeProcesses(): void {
    if (XScraper.chromeCleaned) {
      this.logger.debug("XScraper", "Chrome processes already cleaned up");
      return;
    }
    try {
      if (process.platform === "darwin") {
        execSync('pkill -f "Google Chrome"');
      } else if (process.platform === "win32") {
        execSync("taskkill /F /IM chrome.exe");
      } else {
        execSync("pkill -f chrome");
      }
      // mark as cleaned to avoid repeating kills
      XScraper.chromeCleaned = true;
      this.logger.info("XScraper", "Cleaned up Chrome processes");
    } catch (error) {
      // プロセスが見つからない場合などのエラーは無視
      this.logger.debug("XScraper", "No Chrome processes to clean up");
    }
  }

  /**
   * Seleniumドライバーを初期化（シングルインスタンス）
   */
  private async initDriver(): Promise<WebDriver> {
    if (this.driver) {
      return this.driver;
    }

    this.logger.info("XScraper", "Initializing Selenium WebDriver");

    try {
      this.cleanupChromeProcesses();

      const options = new chrome.Options();
      options.addArguments("--headless");
      options.addArguments("--window-size=1920,3000");
      options.addArguments("--disable-blink-features=AutomationControlled");
      options.addArguments("--no-sandbox");
      options.addArguments("--disable-dev-shm-usage");
      options.addArguments("--disable-gpu");

      // 固定User-Agentを設定
      options.addArguments(
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      );

      // 自動化検出を回避するための設定
      options.addArguments("--disable-infobars");
      options.addArguments("--disable-notifications");
      options.addArguments("--enable-features=NetworkService,NetworkServiceInProcess");
      options.addArguments("--disable-automation");

      // インコグニートモードを使用してクリーンな状態を保証
      options.addArguments("--incognito");

      this.driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

      // CDP経由で自動化フラグを変更
      await this.driver.executeScript(`
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
      `);

      return this.driver;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error("XScraper", "Failed to initialize WebDriver", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`WebDriver initialization failed: ${errorMessage}`);
    }
  }

  /**
   * ログインを実行してセッションを確立
   */
  public async login(): Promise<boolean> {
    if (!this.credentials) {
      this.logger.error("XScraper", "No credentials provided for login");
      return false;
    }

    try {
      const driver = await this.initDriver();
      this.logger.info("XScraper", "Starting login process");

      // ログインページにアクセス
      await driver.get("https://x.com/i/flow/login");
      await driver.sleep(5000);

      // email入力 -> ENTER
      try {
        const emailInput = await driver.findElement(By.css("input[autocomplete='username']"));
        await emailInput.sendKeys(this.credentials.email, Key.RETURN);
        await driver.sleep(5000);
      } catch {
        this.logger.debug("XScraper", "Email input stage skipped");
      }

      // username入力（必要時）
      try {
        const userInput = await driver.findElement(By.css("input[name='text']"));
        await userInput.sendKeys(this.credentials.username, Key.RETURN);
        await driver.sleep(5000);
      } catch {
        this.logger.debug("XScraper", "Username verification not required");
      }

      // password入力 -> ENTER
      const passwordInput = await driver.findElement(By.css("input[name='password']"));
      await passwordInput.sendKeys(this.credentials.password, Key.RETURN);
      await driver.sleep(5000);

      // login success check
      await driver.wait(until.elementLocated(By.css("div[data-testid='primaryColumn']")), 10000);
      this.logger.info("XScraper", "Login successful");
      return true;
    } catch (error) {
      this.logger.error("XScraper", "Login failed:", error);
      return false;
    }
  }

  /**
   * 単一のXアカウントをチェック
   */
  public async checkSingleAccount(xId: string): Promise<Tweet[] | null> {
    const driver = await this.initDriver();

    try {
      this.logger.info("XScraper", `Checking X account: ${xId}`);

      const url = `https://x.com/${xId}`;

      // ページに移動
      this.logger.debug("XScraper", `Navigating to ${url}`);
      await driver.get(url);

      // Xのページが完全に読み込まれるのを十分な時間待つ
      await driver.sleep(5000);

      // ページが読み込まれるのを待つ
      await driver.wait(until.elementLocated(By.css('article[data-testid="tweet"]')), 10000);

      // ツイートを抽出
      const tweets = await this.extractTweets(driver);
      this.logger.info("XScraper", `Extracted ${tweets.length} tweets from ${xId}`);

      if (tweets.length === 0) {
        this.logger.warn("XScraper", `No tweets found for ${xId}`);
        return null;
      }

      // アカウント情報を取得
      const accounts = await getAllXAccounts();
      const account = accounts.find((acc) => acc.id === xId);

      if (!account) {
        this.logger.error("XScraper", `Account ${xId} not found in database`);
        return null;
      }

      // 最新のツイートを保存し、アカウントを更新
      const latestTweetId = await saveTweets(xId, tweets);

      if (latestTweetId && latestTweetId !== account.lastTweetId) {
        this.logger.info("XScraper", `Change detected for ${xId}`);
        return tweets;
      } else {
        this.logger.info("XScraper", `No change for ${xId}`);
        return null;
      }
    } catch (error) {
      this.logger.error("XScraper", `Error checking account ${xId}:`, error);
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
      this.logger.debug("XScraper", `Found ${tweetElements.length} tweet elements`);

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
          this.logger.error("XScraper", "Error extracting tweet data:", error);
        }
      }
    } catch (error) {
      this.logger.error("XScraper", "Error finding tweet elements:", error);
    }

    return tweets.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  /**
   * コンテンツが仮想通貨関連かどうかをチェック
   */
  private async isCryptoRelated(content: string): Promise<CryptoAnalysis> {
    try {
      this.logger.info("XScraper", "Analyzing content for crypto relevance");

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
      this.logger.debug("XScraper", `OpenAI analysis result: ${result}`);

      return {
        isCryptoRelated: !result.includes("関連なし"),
        analysisResult: result,
      };
    } catch (error) {
      this.logger.error("XScraper", "Error checking crypto relevance:", error);
      return {
        isCryptoRelated: false,
        analysisResult: "Error analyzing content",
      };
    }
  }

  /**
   * アカウントを監視リストに追加
   */
  public async addAccount(xId: string, userId: string): Promise<boolean> {
    try {
      this.logger.info("XScraper", `Adding/updating account ${xId} for user ${userId}`);

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
          this.logger.info("XScraper", `Added user ${userId} to existing account ${xId}`);
        } else {
          this.logger.info("XScraper", `User ${userId} already following account ${xId}`);
        }
      } else {
        // 新しいアカウントを作成
        account = {
          id: xId,
          displayName: null,
          profileImageUrl: null,
          lastTweetId: null,
          userIds: [userId],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.logger.info("XScraper", `Created new account entry for ${xId}`);
      }

      // アカウントを保存
      await saveXAccount(account);

      // 初回チェックを実施
      await this.checkSingleAccount(xId);

      return true;
    } catch (error) {
      this.logger.error("XScraper", `Error adding account ${xId}:`, error);
      return false;
    }
  }

  /**
   * 別タブでアカウントのツイートを取得
   */
  private async scrapeInTab(driver: WebDriver, xId: string): Promise<Tweet[] | null> {
    const originalHandle = await driver.getWindowHandle();
    await driver.switchTo().newWindow("tab");
    const handles = await driver.getAllWindowHandles();
    const newHandle = handles.find((h) => h !== originalHandle);
    if (newHandle) {
      await driver.switchTo().window(newHandle);
    }
    try {
      const url = `https://x.com/${xId}`;
      this.logger.debug("XScraper", `Navigating to ${url} in new tab`);
      await driver.get(url);
      await driver.sleep(2000);
      await driver.wait(until.elementLocated(By.css('article[data-testid="tweet"]')), 10000);
      return await this.extractTweets(driver);
    } catch (error) {
      this.logger.error("XScraper", `Error scraping account ${xId} in tab:`, error);
      return null;
    } finally {
      // タブを閉じて元のタブに戻る
      try {
        await driver.close();
      } catch (e) {
        this.logger.debug("XScraper", "Error closing tab, may already be closed", e);
      }
      try {
        await driver.switchTo().window(originalHandle);
      } catch (e) {
        this.logger.debug("XScraper", "Error switching back to original tab", e);
      }
    }
  }

  /**
   * 登録されたすべてのXアカウントをチェック（複数ドライバーを用いた並列処理）
   */
  public async checkXAccounts(concurrency: number = 5): Promise<void> {
    const accounts = await getAllXAccounts();
    this.logger.info("XScraper", `Found ${accounts.length} accounts to check`);
    if (accounts.length === 0) {
      this.logger.warn("XScraper", "No accounts to check");
      return;
    }
    // Split accounts into batches for parallel processing
    const batches: (typeof accounts)[] = [];
    for (let i = 0; i < concurrency; i++) {
      const start = Math.floor((accounts.length * i) / concurrency);
      const end = Math.floor((accounts.length * (i + 1)) / concurrency);
      batches.push(accounts.slice(start, end));
    }
    this.logger.info("XScraper", `Starting scraping with concurrency=${concurrency}`);
    // Process each batch in parallel using separate driver instances
    await Promise.all(batches.map((batch) => this.processBatch(batch)));
    this.logger.info("XScraper", "Finished checking all X accounts");
  }

  // プライベート: アカウントバッチを処理する
  private async processBatch(batch: { id: string }[]): Promise<void> {
    const scraper = new XScraper(this.credentials || undefined);
    try {
      // 初回ログイン
      if (this.credentials) {
        const ok = await scraper.login();
        if (!ok) {
          this.logger.error("XScraper", "Login failed for batch, skipping batch");
          return;
        }
      }
      this.logger.info("XScraper", `Processing batch with ${batch.length} accounts`);
      for (const acc of batch) {
        try {
          const tweets = await scraper.checkSingleAccount(acc.id);
          if (tweets && tweets.length > 0) {
            this.logger.info("XScraper", `Fetched ${tweets.length} tweets for ${acc.id}`);
            await saveTweets(acc.id, tweets);
          } else {
            this.logger.info("XScraper", `No new tweets for ${acc.id}`);
          }
        } catch (err) {
          this.logger.error("XScraper", `Error scraping ${acc.id}:`, err);
        }
        // 少し待ってサーバー負荷を抑える
        await new Promise((r) => setTimeout(r, 2000));
      }
    } finally {
      await scraper.closeDriver();
    }
  }

  /**
   * ドライバーをクローズ
   */
  public async closeDriver(): Promise<void> {
    if (this.driver) {
      try {
        await this.driver.quit();
      } catch (err) {
        this.logger.error("XScraper", "Error closing WebDriver", err);
      }
      this.driver = null;
    }
  }
}

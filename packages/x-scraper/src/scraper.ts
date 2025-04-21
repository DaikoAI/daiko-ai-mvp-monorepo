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

// User-Agent一覧
const USER_AGENTS = [
  // デスクトップ
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",

  // Firefox
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",

  // Safari
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",

  // Edge
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",

  // モバイル
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
];

// ランダムなUser-Agentを取得する関数
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export class XScraper {
  private openai: OpenAI;
  private driverPool: WebDriver[] = [];
  private maxDrivers = 3; // 同時に使用するドライバーの最大数
  private availableDrivers: WebDriver[] = [];
  private logger = new Logger({
    level: LogLevel.INFO,
  });
  private credentials: XCredentials | null = null;

  constructor(credentials?: XCredentials, maxDrivers = 3) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (credentials) {
      this.credentials = credentials;
    }
    this.maxDrivers = maxDrivers;
  }

  /**
   * Chromeプロセスをクリーンアップ
   */
  private cleanupChromeProcesses(): void {
    try {
      if (process.platform === "darwin") {
        execSync('pkill -f "Google Chrome"');
      } else if (process.platform === "win32") {
        execSync("taskkill /F /IM chrome.exe");
      } else {
        execSync("pkill -f chrome");
      }
      this.logger.info("XScraper", "Cleaned up Chrome processes");
    } catch (error) {
      // プロセスが見つからない場合などのエラーは無視
      this.logger.debug("XScraper", "No Chrome processes to clean up");
    }
  }

  /**
   * Seleniumドライバーを初期化
   */
  private async initDriver(): Promise<WebDriver> {
    if (this.driverPool.length > 0) {
      return this.driverPool[0];
    }

    this.logger.info("XScraper", "Initializing Selenium WebDriver");

    try {
      // 既存のChromeプロセスをクリーンアップ
      this.cleanupChromeProcesses();

      const options = new chrome.Options();
      options.addArguments("--headless");
      options.addArguments("--start-maximized");
      options.addArguments("--disable-blink-features=AutomationControlled");
      options.addArguments("--no-sandbox");
      options.addArguments("--disable-dev-shm-usage");
      options.addArguments("--disable-gpu");
      options.addArguments("--window-size=1920,1080");

      // ランダムなUser-Agentを設定
      options.addArguments(`--user-agent=${getRandomUserAgent()}`);

      // 自動化検出を回避するための設定
      options.addArguments("--disable-infobars");
      options.addArguments("--disable-notifications");
      options.addArguments("--enable-features=NetworkService,NetworkServiceInProcess");
      options.addArguments("--disable-automation");

      // インコグニートモードを使用してクリーンな状態を保証
      options.addArguments("--incognito");

      const driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

      // CDP経由で自動化フラグを変更
      await driver.executeScript(`
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
      `);

      return driver;
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
   * ドライバープールを初期化
   */
  private async initializeDriverPool(): Promise<void> {
    if (this.driverPool.length > 0) {
      return; // 既に初期化済み
    }

    this.logger.info("XScraper", `Initializing driver pool with ${this.maxDrivers} drivers`);

    try {
      // 指定された数のドライバーを作成
      for (let i = 0; i < this.maxDrivers; i++) {
        const driver = await this.initDriver();
        // ログイン処理を実行
        if (await this.loginToDriver(driver)) {
          this.driverPool.push(driver);
          this.availableDrivers.push(driver);
          this.logger.info("XScraper", `Driver ${i + 1} initialized and logged in successfully`);
        } else {
          await driver.quit();
          this.logger.error("XScraper", `Failed to login with driver ${i + 1}`);
        }
        // ドライバー作成間隔を空ける（Bot対策）
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      this.logger.error("XScraper", "Error initializing driver pool:", error);
      throw error;
    }
  }

  /**
   * 利用可能なドライバーを取得
   */
  private async getAvailableDriver(): Promise<WebDriver | null> {
    if (this.availableDrivers.length === 0) {
      if (this.driverPool.length === 0) {
        await this.initializeDriverPool();
      }
      // すべてのドライバーが使用中の場合は待機
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.getAvailableDriver();
    }
    return this.availableDrivers.pop() || null;
  }

  /**
   * ドライバーを解放
   */
  private releaseDriver(driver: WebDriver): void {
    if (this.driverPool.includes(driver) && !this.availableDrivers.includes(driver)) {
      this.availableDrivers.push(driver);
    }
  }

  /**
   * 特定のドライバーでログイン
   */
  private async loginToDriver(driver: WebDriver): Promise<boolean> {
    if (!this.credentials) {
      this.logger.error("XScraper", "No credentials provided for login");
      return false;
    }

    try {
      this.logger.info("XScraper", "Starting login process");

      // ログインページにアクセス
      await driver.get("https://x.com/i/flow/login");

      // ランダムな待機時間を設定（より人間らしい動作に）
      const randomWait = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

      try {
        // メールアドレスを入力（一文字ずつ入力して人間らしく）
        const emailInput = await driver.wait(until.elementLocated(By.css('input[autocomplete="username"]')), 10000);

        for (const char of this.credentials.email) {
          await emailInput.sendKeys(char);
          await driver.sleep(randomWait(50, 150));
        }

        await driver.sleep(randomWait(500, 1000));
        await emailInput.sendKeys(Key.RETURN);
        await driver.sleep(randomWait(2000, 3000));

        // 不審なアクセスと判断された場合、ユーザー名の入力を求められる
        try {
          const usernameInput = await driver.wait(until.elementLocated(By.css('input[name="text"]')), 5000);

          for (const char of this.credentials.username) {
            await usernameInput.sendKeys(char);
            await driver.sleep(randomWait(50, 150));
          }

          await driver.sleep(randomWait(500, 1000));
          await usernameInput.sendKeys(Key.RETURN);
          await driver.sleep(randomWait(2000, 3000));
        } catch (error) {
          this.logger.debug("XScraper", "Username verification not required");
        }

        // パスワードを入力
        const passwordInput = await driver.wait(until.elementLocated(By.css('input[name="password"]')), 10000);

        for (const char of this.credentials.password) {
          await passwordInput.sendKeys(char);
          await driver.sleep(randomWait(50, 150));
        }

        await driver.sleep(randomWait(500, 1000));
        await passwordInput.sendKeys(Key.RETURN);
        await driver.sleep(randomWait(3000, 5000));

        // ログイン成功の確認（ホームフィードが表示されるまで待機）
        await driver.wait(until.elementLocated(By.css('div[data-testid="primaryColumn"]')), 10000);

        this.logger.info("XScraper", "Login successful");
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error("XScraper", "Login failed", {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
        await driver.takeScreenshot().then((image) => {
          require("fs").writeFileSync("debug-login-error.png", image, "base64");
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error("XScraper", "Login process failed", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  /**
   * 単一のXアカウントをチェック
   */
  public async checkSingleAccount(xId: string): Promise<Tweet[] | null> {
    const driver = await this.getAvailableDriver();
    if (!driver) {
      this.logger.error("XScraper", "No available driver");
      return null;
    }

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
    } finally {
      // ドライバーを解放
      this.releaseDriver(driver);
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
   * 登録されたすべてのXアカウントをチェック
   */
  public async checkXAccounts(): Promise<void> {
    try {
      this.logger.info("XScraper", "Starting to check all X accounts");

      const accounts = await getAllXAccounts();
      this.logger.info("XScraper", `Found ${accounts.length} accounts to check`);

      if (accounts.length === 0) {
        this.logger.warn("XScraper", "No accounts to check");
        return;
      }

      // ドライバープールを初期化
      await this.initializeDriverPool();

      // アカウントを並列処理
      const batchSize = this.maxDrivers; // 同時実行数
      for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize);
        const promises = batch.map((account) => {
          if (!account.id) return Promise.resolve(null);
          return this.checkSingleAccount(account.id);
        });

        await Promise.all(promises);

        // バッチ間で待機（レート制限対策）
        if (i + batchSize < accounts.length) {
          await new Promise((resolve) => setTimeout(resolve, 20000));
        }
      }

      this.logger.info("XScraper", "Finished checking all X accounts");
    } catch (error) {
      this.logger.error("XScraper", "Error checking X accounts:", error);
      throw error;
    }
  }

  /**
   * すべてのドライバーをクローズ
   */
  public async closeAllDrivers(): Promise<void> {
    this.logger.info("XScraper", "Closing all WebDrivers");

    for (const driver of this.driverPool) {
      try {
        await driver.quit();
      } catch (error) {
        this.logger.error("XScraper", "Error closing WebDriver", error);
      }
    }

    this.driverPool = [];
    this.availableDrivers = [];
  }
}

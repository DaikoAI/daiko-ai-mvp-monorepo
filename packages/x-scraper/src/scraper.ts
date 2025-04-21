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

  constructor(credentials?: XCredentials) {
    // OpenAI APIクライアントを初期化
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
    if (this.driver) {
      return this.driver;
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
   * Xアカウントにログイン
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

      // ランダムな待機時間を設定（より人間らしい動作に）
      const randomWait = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

      try {
        // メールアドレスを入力（一文字ずつ入力して人間らしく）
        const emailInput = await driver.wait(until.elementLocated(By.css('input[autocomplete="username"]')), 10000);

        for (const char of this.credentials.email) {
          await emailInput.sendKeys(char);
          this.logger.debug("XScraper", `Inputting email: ${char}`);
          await driver.sleep(randomWait(50, 150));
        }

        // Enterキーを使用してNext
        this.logger.debug("XScraper", "Sending Enter key");
        await driver.sleep(randomWait(500, 1000));
        await emailInput.sendKeys(Key.RETURN);
        this.logger.debug("XScraper", "Enter key sent");
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
   * ドライバーをクローズ
   */
  public async closeDriver(): Promise<void> {
    if (this.driver) {
      this.logger.info("XScraper", "Closing WebDriver");
      try {
        await this.driver.quit();
      } catch (error) {
        this.logger.error("XScraper", "Error closing WebDriver", error);
      } finally {
        this.driver = null;
      }
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

      for (const account of accounts) {
        if (!account.id) continue;

        try {
          await this.checkSingleAccount(account.id);
          // アカウント間で少し間隔を空ける（レート制限対策）
          await new Promise((resolve) => setTimeout(resolve, 20000));
        } catch (error) {
          this.logger.error("XScraper", `Error checking account ${account.id}:`, error);
        }
      }

      this.logger.info("XScraper", "Finished checking all X accounts");
    } catch (error) {
      this.logger.error("XScraper", "Error checking X accounts:", error);
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
      this.logger.info("XScraper", `Checking X account: ${xId}`);

      const driver = await this.initDriver();
      const url = `https://x.com/${xId}`;

      // ページに移動
      this.logger.debug("XScraper", `Navigating to ${url}`);
      await driver.get(url);

      // Xのページが完全に読み込まれるのを十分な時間待つ
      await driver.sleep(5000); // ページのJavaScriptが実行される時間を確保

      // ページが読み込まれるのを待つ - 複数のセレクターを試す
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
}

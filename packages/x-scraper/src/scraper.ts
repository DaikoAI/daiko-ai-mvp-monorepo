import { CryptoAnalysis, Logger, LogLevel, Tweet } from "@daiko-ai/shared";
import { execSync } from "node:child_process";
import { OpenAI } from "openai";
import {
  Browser,
  Builder,
  By,
  Key,
  IWebDriverOptionsCookie as SeleniumCookie,
  until,
  WebDriver,
} from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { getAllXAccounts, saveTweets, saveXAccount } from "./db";

// Helper function to create random delays
const randomDelay = (min = 1500, max = 3500) => Math.floor(Math.random() * (max - min + 1)) + min;

// Xアカウントのログイン情報の型定義
export interface XCredentials {
  email: string;
  password: string;
  username: string;
}

export class XScraper {
  // shared session cookies for login reuse
  private sessionCookies: any[] | null = null;

  private openai: OpenAI;
  private driver: WebDriver | null = null;
  private logger = new Logger({
    level: LogLevel.INFO,
  });
  private credentials: XCredentials | null = null;
  // static flag to ensure Chrome processes are cleaned up only once
  private static chromeCleaned = false;

  constructor(credentials?: XCredentials, sessionCookies?: any[]) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (credentials) {
      this.credentials = credentials;
    }
    // accept pre-logged-in session cookies
    if (sessionCookies) {
      this.sessionCookies = sessionCookies;
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

      // inject session cookies if present
      if (this.sessionCookies && this.sessionCookies.length > 0) {
        // navigate to base domain to apply cookies
        await this.driver.get("https://x.com");
        for (const cookie of this.sessionCookies) {
          try {
            // cast to SeleniumCookie to satisfy overload
            await this.driver.manage().addCookie(cookie as SeleniumCookie);
          } catch (e) {
            this.logger.debug("XScraper", "Failed to add cookie", e);
          }
        }
      }

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

    let driver: WebDriver | null = null;
    try {
      driver = await this.initDriver();
      this.logger.info("XScraper", "Starting login process");

      // ログインページにアクセス
      await driver.get("https://x.com/i/flow/login");
      // Use explicit wait for the initial input field instead of just sleep
      // await driver.sleep(1000);

      // --- Find and interact with the initial input field (Email/Phone/Username) ---
      const initialInputSelector = By.css("input[name='text'][autocomplete='username']"); // More specific selector
      try {
        this.logger.info("XScraper", "Waiting for initial input field to be located...");
        await driver.wait(until.elementLocated(initialInputSelector), 20000); // Wait up to 20s

        this.logger.info("XScraper", "Waiting for initial input field to be visible and enabled...");
        const emailOrUsernameInput = await driver.findElement(initialInputSelector);
        await driver.wait(until.elementIsVisible(emailOrUsernameInput), 10000);
        await driver.wait(until.elementIsEnabled(emailOrUsernameInput), 10000);

        this.logger.info("XScraper", "Initial input field located and ready. Entering email...");
        await emailOrUsernameInput.sendKeys(this.credentials.email);
        await driver.sleep(randomDelay(500, 1500)); // Shorter delay after typing
        await emailOrUsernameInput.sendKeys(Key.RETURN);
        this.logger.info("XScraper", "Initial input (email) submitted.");
        await driver.sleep(randomDelay(1500, 4000)); // Wait for next step page load
      } catch (error) {
        this.logger.error("XScraper", "Failed to find or interact with the initial email/username input field", {
          error: error instanceof Error ? error.message : String(error),
          url: await driver.getCurrentUrl(),
        });
        try {
          this.logger.info("XScraper", "HTML source on initial input failure:", {
            html: await driver.getPageSource(),
          });
        } catch (logError) {
          this.logger.warn("XScraper", "Failed to get page source on initial input failure", logError);
        }
        throw error; // Stop login if initial input fails
      }

      // --- Handle potential intermediate step (like username verification) ---
      // This step might occur after submitting email if verification is needed.
      const usernameVerificationSelector = By.css("input[name='text']"); // Re-using selector, assuming it's specific enough for this step
      try {
        this.logger.info("XScraper", "Checking for potential username verification step...");
        // Use a shorter wait time as this step is optional
        await driver.wait(until.elementLocated(usernameVerificationSelector), 7000); // Wait 7 seconds

        const usernameInput = await driver.findElement(usernameVerificationSelector);
        // Check if the element is visible and enabled *before* interacting
        await driver.wait(until.elementIsVisible(usernameInput), 5000);
        await driver.wait(until.elementIsEnabled(usernameInput), 5000);

        // Simple check: if the value is empty, assume it's the verification step
        const currentValue = await usernameInput.getAttribute("value");
        if (currentValue === "") {
          this.logger.info("XScraper", "Username verification step detected. Entering username...");
          await usernameInput.sendKeys(this.credentials.username);
          await driver.sleep(randomDelay(500, 1500));
          await usernameInput.sendKeys(Key.RETURN);
          this.logger.info("XScraper", "Username submitted for verification.");
          await driver.sleep(randomDelay(1500, 4000)); // Wait after submitting username
        } else {
          this.logger.info("XScraper", "Input field found, but not empty. Assuming not username verification step.");
        }
      } catch (e) {
        // Timeout or element not interactable - assume the username step was skipped or failed.
        this.logger.info("XScraper", "Username verification step not detected or timed out, proceeding.");
      }

      // Log HTML source *before* trying to find the password input
      try {
        this.logger.info("XScraper", "HTML source before finding password input:", {
          html: await driver.getPageSource(),
        });
      } catch (logError) {
        this.logger.warn("XScraper", "Failed to get page source before password input", logError);
      }

      // password入力 -> ENTER
      this.logger.info("XScraper", "Attempting to find password input...");
      const passwordSelector = By.css("input[name='password']");
      try {
        await driver.wait(until.elementLocated(passwordSelector), 30000);
        this.logger.info("XScraper", "Password input field located.");
        const passwordInput = await driver.findElement(passwordSelector);
        await driver.sleep(randomDelay());
        await passwordInput.sendKeys(this.credentials.password);
        await driver.sleep(randomDelay());
        await passwordInput.sendKeys(Key.RETURN);
        this.logger.info("XScraper", "Password submitted.");
      } catch (error) {
        const currentUrl = await driver.getCurrentUrl();

        this.logger.error("XScraper", "Failed to find or interact with password input", {
          error: error instanceof Error ? error.message : String(error),
          url: currentUrl,
        });

        this.logger.info("XScraper", "Current HTML", {
          html: await driver.getPageSource(),
        });

        throw error;
      }

      // login success check
      this.logger.info("XScraper", "Waiting for login success confirmation...");
      await driver.sleep(randomDelay(2000, 4000));
      await driver.wait(until.elementLocated(By.css("div[data-testid='primaryColumn']")), 30000);
      this.logger.info("XScraper", "Login successful");

      // store cookies for reuse in child instances
      try {
        this.sessionCookies = await driver.manage().getCookies();
      } catch (e) {
        this.logger.debug("XScraper", "Unable to retrieve cookies", e);
      }

      return true;
    } catch (error) {
      this.logger.error("XScraper", "Login failed:", error);
      // エラー発生時にスクリーンショットを撮るなどの処理を追加することも検討
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
   * 登録されたすべてのXアカウントをチェック（並列処理）
   */
  public async checkXAccounts(concurrency: number = 10): Promise<void> {
    // ログイン専用の一時的なスクレイパーインスタンスを作成
    const mainScraper = new XScraper(this.credentials ?? undefined);
    let baseCookies: any[] = [];

    try {
      this.logger.info("XScraper", "Attempting initial login to retrieve session cookies...");
      const loggedIn = await mainScraper.login();
      if (!loggedIn) {
        this.logger.error("XScraper", "Initial login failed, cannot proceed with checking accounts.");
        return; // ログイン失敗時は処理を中断
      }

      // ログイン成功後、クッキーを取得
      baseCookies = mainScraper.sessionCookies ?? [];
      if (baseCookies.length === 0) {
        this.logger.warn("XScraper", "Retrieved session cookies are empty, proceeding without them.");
      }
      this.logger.info("XScraper", `Initial login successful. Retrieved ${baseCookies.length} cookies.`);
    } catch (loginError) {
      this.logger.error("XScraper", "Error during initial login process:", loginError);
      return; // ログインプロセス中にエラーが発生した場合も中断
    }

    // DBからアカウントリストを取得
    const accounts = await getAllXAccounts();
    this.logger.info("XScraper", `Found ${accounts.length} accounts to check.`);

    if (accounts.length === 0) {
      this.logger.warn("XScraper", "No accounts found in DB to check.");
      return;
    }

    this.logger.info("XScraper", `Starting parallel scraping with concurrency=${concurrency}`);

    // アカウントリストをバッチに分割して並列処理
    for (let i = 0; i < accounts.length; i += concurrency) {
      const batch = accounts.slice(i, i + concurrency);
      this.logger.info(
        "XScraper",
        `Processing batch ${Math.floor(i / concurrency) + 1}: accounts ${i + 1}-${i + batch.length}`,
      );

      const tasks = batch.map((acc) => {
        // 各アカウントごとに新しいスクレイパーインスタンスを作成し、取得したクッキーを渡す
        const scraper = new XScraper(undefined, baseCookies);
        return (async () => {
          try {
            // initDriver内でクッキーが適用されるため、再度login()を呼ぶ必要はない
            const tweets = await scraper.checkSingleAccount(acc.id);
            if (tweets && tweets.length > 0) {
              this.logger.info("XScraper", `Fetched ${tweets.length} new tweets for ${acc.id}`);
              // DB保存は checkSingleAccount 内で行われる
            } else {
              this.logger.info("XScraper", `No new tweets or change detected for ${acc.id}`);
            }
          } catch (err) {
            this.logger.error("XScraper", `Error scraping ${acc.id}:`, err);
          } finally {
            // 各インスタンスのWebDriverを確実に閉じる
            await scraper.closeDriver();
            this.logger.debug("XScraper", `Closed driver for account ${acc.id}`);
          }
        })();
      });

      // 現在のバッチの処理がすべて完了するのを待つ
      await Promise.allSettled(tasks);
      this.logger.info("XScraper", `Finished processing batch ${Math.floor(i / concurrency) + 1}`);

      // 次のバッチがある場合は、負荷軽減のために少し待機
      if (i + concurrency < accounts.length) {
        const waitTime = 2000; // 2秒待機
        this.logger.debug("XScraper", `Waiting ${waitTime}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.logger.info("XScraper", "Finished checking all X accounts in parallel.");
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

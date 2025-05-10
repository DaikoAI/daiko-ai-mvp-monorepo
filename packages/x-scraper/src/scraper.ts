import { Logger, LogLevel, Tweet } from "@daiko-ai/shared";
import * as fs from "node:fs"; // Import fs for screenshots
import * as path from "node:path"; // Added to handle screenshot directory
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

  private driver: WebDriver | null = null;
  private logger = new Logger({
    level: LogLevel.INFO,
  });
  private credentials: XCredentials | null = null;
  // static flag to ensure Chrome processes are cleaned up only once
  private static chromeCleaned = false;

  constructor(credentials?: XCredentials, sessionCookies?: any[]) {
    if (credentials) {
      this.credentials = credentials;
    }
    // accept pre-logged-in session cookies
    if (sessionCookies) {
      this.sessionCookies = sessionCookies;
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
      // this.cleanupChromeProcesses(); // Call removed

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

      // --- Check if JavaScript is enabled after initialization ---
      try {
        const readyState = await this.driver.executeScript("return document.readyState");
        const userAgent = await this.driver.executeScript("return navigator.userAgent");
        this.logger.info("XScraper", "JavaScript execution check after init", {
          readyState,
          userAgent,
        });
        if (readyState !== "complete" && readyState !== "interactive") {
          this.logger.warn("XScraper", `Potential JS issue: readyState is '${readyState}'`);
        }
      } catch (jsError) {
        this.logger.error("XScraper", "Failed to execute basic JavaScript after init!", {
          error: jsError instanceof Error ? jsError.message : String(jsError),
        });
        // Optionally throw an error here if JS is critical
        // throw new Error("JavaScript failed to execute in browser.");
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

      // --- Find and interact with the initial input field (Email/Phone/Username) ---
      const initialInputSelector = By.css("input[autocomplete='username']"); // Simpler selector

      try {
        this.logger.info("XScraper", `Waiting for initial input field (${initialInputSelector}) to be located...`);
        await driver.wait(until.elementLocated(initialInputSelector), 30000);
        const emailOrUsernameInput = await driver.findElement(initialInputSelector);

        this.logger.info("XScraper", "Waiting for initial input field to be visible and enabled...");
        await driver.wait(until.elementIsVisible(emailOrUsernameInput), 15000);
        await driver.wait(until.elementIsEnabled(emailOrUsernameInput), 15000);

        this.logger.info("XScraper", "Initial input field located and ready. Entering email...");
        await emailOrUsernameInput.sendKeys(this.credentials.email);
        await driver.sleep(randomDelay(500, 1500));

        // Revert to clicking the "Next" button explicitly
        this.logger.info("XScraper", "Locating and clicking the Next button for initial input...");
        const nextButton = await driver.findElement(By.xpath("//button[.//span[text()='Next']]"));
        await driver.wait(until.elementIsEnabled(nextButton), 10000);
        await nextButton.click();
        this.logger.info("XScraper", "Initial input (email) submitted via Next button click.");

        // --- Wait for page transition after clicking Next ---
        this.logger.info("XScraper", "Waiting for page transition after submitting email...");
        const passwordSelector = By.css("input[name='password']");
        const usernameVerificationSelector = By.css("input[name='text']"); // Re-using this selector for check
        const expectedUrlPattern = /login\/(identifier|password)/; // Correct regex literal

        // Ensure driver is not null before proceeding
        if (!driver) {
          throw new Error("Driver became null unexpectedly before page transition wait.");
        }

        // Re-assign to a new const to satisfy TS null check within the callback scope
        const nonNullDriver = driver;

        try {
          await nonNullDriver.wait(async () => {
            // Use nonNullDriver inside the callback
            const currentUrl = await nonNullDriver.getCurrentUrl();
            const passwordField = await nonNullDriver.findElements(passwordSelector);
            const usernameField = await nonNullDriver.findElements(usernameVerificationSelector);
            return expectedUrlPattern.test(currentUrl) || passwordField.length > 0 || usernameField.length > 0;
          }, 40000);
          this.logger.info("XScraper", `Page transitioned. Current URL: ${await nonNullDriver.getCurrentUrl()}`);
        } catch (transitionError) {
          this.logger.error(
            "XScraper",
            "Page did not transition after email submission or next elements not found within timeout.",
            {
              error: transitionError instanceof Error ? transitionError.message : String(transitionError),
              url: await nonNullDriver.getCurrentUrl(), // Use nonNullDriver here too
            },
          );
          try {
            this.logger.info("XScraper", "HTML source on transition failure:", {
              html: await nonNullDriver.getPageSource(),
            });
          } catch (logError) {
            this.logger.warn("XScraper", "Failed to get page source on transition failure", logError);
          }
          throw transitionError;
        }

        // --- Handle EITHER username verification OR password input ---
        this.logger.info("XScraper", "Checking if password input or username verification is present...");

        // Check for password field first
        const passwordElements = await driver.findElements(passwordSelector);
        if (passwordElements.length > 0) {
          this.logger.info("XScraper", "Password input field found directly after email submission.");
          // Proceed directly to password input logic
        } else {
          // Check for username verification step if password field wasn't found
          try {
            this.logger.info("XScraper", "Password input not found, checking for username verification step...");
            // Use a more specific wait for the username input in this context
            await driver.wait(until.elementLocated(usernameVerificationSelector), 5000);
            const usernameInput = await driver.findElement(usernameVerificationSelector);
            await driver.wait(until.elementIsVisible(usernameInput), 5000);
            await driver.wait(until.elementIsEnabled(usernameInput), 5000);

            // A simple check: if a visible input[name='text'] exists here, assume it's username verification
            this.logger.info("XScraper", "Username verification step detected. Entering username...");
            await usernameInput.sendKeys(this.credentials.username);
            await driver.sleep(randomDelay(500, 1500));

            // Click the "Next" button explicitly for username step
            this.logger.info("XScraper", "Locating and clicking the Next button for username...");
            const usernameNextButton = await driver.findElement(By.xpath("//button[.//span[text()='Next']]"));
            await driver.wait(until.elementIsEnabled(usernameNextButton), 10000);
            await usernameNextButton.click();

            this.logger.info("XScraper", "Username submitted for verification via Next button click.");
            const urlAfterUsernameSubmit = await driver.getCurrentUrl();
            this.logger.info("XScraper", `URL after username submit: ${urlAfterUsernameSubmit}`);
            // Wait specifically for the password field after submitting username
            this.logger.info("XScraper", "Waiting for password field after username submission...");
            await driver.wait(until.elementLocated(passwordSelector), 30000); // Wait for password field
          } catch (e) {
            this.logger.error(
              "XScraper",
              "Failed to handle username verification step or password field did not appear after it.",
              e,
            );
            throw e; // If neither password nor username verification worked, fail
          }
        }

        // --- Password Input Logic (now executed after confirming transition) ---
        this.logger.info("XScraper", "Attempting to find and interact with password input...");
        // const passwordSelector = By.css("input[name='password']"); // Defined above
        try {
          // We already waited for the element, just need to find and interact
          const passwordInput = await driver.findElement(passwordSelector);
          this.logger.info("XScraper", "Password input field found.");
          await driver.wait(until.elementIsVisible(passwordInput), 10000); // Add visibility check
          await driver.wait(until.elementIsEnabled(passwordInput), 10000); // Add enabled check
          await driver.sleep(randomDelay());
          await passwordInput.sendKeys(this.credentials.password);
          await driver.sleep(randomDelay());
          await passwordInput.sendKeys(Key.RETURN);
          this.logger.info("XScraper", "Password submitted.");
          // Add a significant delay after password submission to appear less suspicious
          await driver.sleep(randomDelay(5000, 10000));
        } catch (error) {
          const currentUrl = await driver.getCurrentUrl();
          this.logger.error("XScraper", "Failed to find or interact with password input after confirming transition", {
            error: error instanceof Error ? error.message : String(error),
            url: currentUrl,
          });
          // Log HTML source before re-throwing
          try {
            this.logger.info("XScraper", "HTML source on password input failure:", {
              html: await driver.getPageSource(),
            });
          } catch (logError) {
            this.logger.warn("XScraper", "Failed to get page source on password input failure", logError);
          }
          throw error;
        }

        // login success check
        this.logger.info("XScraper", "Waiting for login success confirmation (e.g., main timeline)...");
        await driver.sleep(randomDelay(2000, 4000)); // Keep a small delay before the main wait
        await driver.wait(until.elementLocated(By.css("div[data-testid='primaryColumn']")), 45000); // Increased timeout slightly
        this.logger.info("XScraper", "Login successful");

        // store cookies for reuse in child instances
        try {
          this.sessionCookies = await driver.manage().getCookies();
        } catch (e) {
          this.logger.debug("XScraper", "Unable to retrieve cookies", e);
        }

        return true;
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
    } catch (error) {
      this.logger.error("XScraper", "Login process failed at some stage", {
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Capture and save failure screenshot
      await this.captureFailureScreenshot("login");
      return false;
    }
  }

  /**
   * 単一のXアカウントをチェック
   * @returns {Promise<string | null>} 変更があった場合は最新のツイートID、なければnull
   */
  public async checkSingleAccount(xId: string): Promise<string | null> {
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
        await this.captureFailureScreenshot("checkSingleAccount");
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
        this.logger.info("XScraper", `Change detected for ${xId}. New latest tweet ID: ${latestTweetId}`);

        // Return latestTweetId if changed
        return latestTweetId;
      } else {
        this.logger.info("XScraper", `No change for ${xId}. Last checked tweet ID: ${account.lastTweetId}`);
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
    // Find all tweet articles on the page
    const elements = await driver.findElements(By.css('article[data-testid="tweet"]'));
    for (const el of elements) {
      try {
        // Extract timestamp
        const timeElem = await el.findElement(By.css("time"));
        const time = await timeElem.getAttribute("datetime");
        // Extract text content of tweet
        let data = "";
        const textNodes = await el.findElements(By.css('div[data-testid="tweetText"]'));
        if (textNodes.length > 0) {
          for (const node of textNodes) {
            data += await node.getText();
          }
        } else {
          // Fallback: gather all language-specific divs
          const langNodes = await el.findElements(By.css("div[lang]"));
          for (const node of langNodes) {
            data += (await node.getText()) + " ";
          }
        }
        tweets.push({ time, data: data.trim() });
      } catch (e) {
        this.logger.debug("XScraper", "Failed to extract single tweet", e);
      }
    }
    // Sort tweets by newest first
    return tweets.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
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
   * @returns {Promise<string[]>} 変更が検出されたアカウントIDの配列
   */
  public async checkXAccounts(concurrency: number = 10): Promise<string[]> {
    const mainScraper = new XScraper(this.credentials ?? undefined);
    // Load or refresh cookies
    let baseCookies = this.loadCookies();
    if (baseCookies.length > 0 && !this.areCookiesExpired(baseCookies)) {
      this.logger.info("XScraper", `Loaded ${baseCookies.length} cookies, skipping login`);
    } else {
      this.logger.info("XScraper", "No valid cookies, performing initial login");
      const loggedIn = await mainScraper.login();
      if (!loggedIn) {
        this.logger.error("XScraper", "Initial login failed, cannot proceed");
        return [];
      }
      baseCookies = mainScraper.sessionCookies ?? [];
      this.saveCookies(baseCookies);
    }

    // DBからアカウントリストを取得
    const accounts = await getAllXAccounts();
    this.logger.info("XScraper", `Found ${accounts.length} accounts to check.`);

    if (accounts.length === 0) {
      this.logger.warn("XScraper", "No accounts found in DB to check.");
      return []; // Return empty array if no accounts
    }

    this.logger.info("XScraper", `Starting parallel scraping with concurrency=${concurrency}`);

    const updatedAccountIds: string[] = []; // Array to store updated account IDs

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
          let changedTweetId: string | null = null;
          try {
            // initDriver内でクッキーが適用されるため、再度login()を呼ぶ必要はない
            changedTweetId = await scraper.checkSingleAccount(acc.id);
            if (changedTweetId) {
              this.logger.info("XScraper", `Change detected for ${acc.id}`);
              // DB保存は checkSingleAccount 内で行われる
              return acc.id; // Return account ID if changed
            } else {
              this.logger.info("XScraper", `No new tweets or change detected for ${acc.id}`);
              return null; // Return null if no change
            }
          } catch (err) {
            this.logger.error("XScraper", `Error scraping ${acc.id}:`, err);
            return null; // Return null on error
          } finally {
            // 各インスタンスのWebDriverを確実に閉じる
            await scraper.closeDriver();
            this.logger.debug("XScraper", `Closed driver for account ${acc.id}`);
          }
        })();
      });

      // Collect results from the batch
      const batchResults = await Promise.allSettled(tasks);
      batchResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          updatedAccountIds.push(result.value); // Add account ID if changed
        }
      });

      this.logger.info(
        "XScraper",
        `Finished processing batch ${Math.floor(i / concurrency) + 1}. Updated accounts in batch: ${batchResults.filter((r) => r.status === "fulfilled" && r.value).length}`,
      );

      // 次のバッチがある場合は、負荷軽減のために少し待機
      if (i + concurrency < accounts.length) {
        const waitTime = 2000; // 2秒待機
        this.logger.debug("XScraper", `Waiting ${waitTime}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.logger.info(
      "XScraper",
      `Finished checking all X accounts. Total updated accounts: ${updatedAccountIds.length}`,
    );
    return updatedAccountIds; // Return the array of updated account IDs
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

  /**
   * Return path to cookies file, ensuring directory exists.
   */
  private getCookiesFilePath(): string {
    const dir = path.resolve(process.cwd(), "cookies");
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, "x-scraper_cookies.json");
  }

  /** Load cookies from disk or return empty array. */
  private loadCookies(): any[] {
    const file = this.getCookiesFilePath();
    if (!fs.existsSync(file)) return [];
    try {
      const data = fs.readFileSync(file, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /** Save cookies array to disk. */
  private saveCookies(cookies: any[]): void {
    const file = this.getCookiesFilePath();
    try {
      fs.writeFileSync(file, JSON.stringify(cookies, null, 2), "utf-8");
      this.logger.info("XScraper", `Cookies saved to ${file}`);
    } catch (err) {
      this.logger.error("XScraper", "Failed to save cookies", err);
    }
  }

  /** Check if any cookie is expired based on `expiry` field. */
  private areCookiesExpired(cookies: any[]): boolean {
    const now = Date.now();
    return cookies.some((c) => typeof c.expiry === "number" && c.expiry * 1000 < now);
  }

  /** Return screenshot path for a given context, ensuring directory exists. */
  private getScreenshotPath(context: string): string {
    const dir = path.resolve(process.cwd(), "screenshots");
    fs.mkdirSync(dir, { recursive: true });
    const name = `${context}_${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    return path.join(dir, name);
  }

  /** Capture a failure screenshot and log its location. */
  private async captureFailureScreenshot(context: string): Promise<void> {
    const screenshotPath = this.getScreenshotPath(context);
    if (!this.driver) return;
    try {
      const img = await this.driver.takeScreenshot();
      fs.writeFileSync(screenshotPath, img, "base64");
      this.logger.info("XScraper", `Screenshot saved to ${screenshotPath}`);
    } catch (err) {
      this.logger.error("XScraper", `Failed to capture ${context} screenshot`, err);
    }
  }
}

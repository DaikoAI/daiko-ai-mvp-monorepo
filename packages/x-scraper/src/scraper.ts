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
  WebElement,
} from "selenium-webdriver";
import {
  BATCH_PROCESSING_WAIT_MS,
  COOKIES_DIR_RELATIVE,
  COOKIES_FILENAME,
  DEFAULT_PROFILE_PATH_RELATIVE,
  DEFAULT_SELENIUM_SCRIPT_TIMEOUT,
  ELEMENT_LOCATE_TIMEOUT_MS,
  INITIAL_INPUT_SELECTOR_CSS,
  LANG_SELECTOR_CSS,
  LOGIN_SUCCESS_DELAY_MAX,
  LOGIN_SUCCESS_DELAY_MIN,
  LOGIN_URL,
  LONG_DELAY_MAX,
  LONG_DELAY_MIN,
  MAX_TWEETS_TO_PROCESS_PER_ACCOUNT,
  MEDIUM_DELAY_MAX,
  MEDIUM_DELAY_MIN,
  NEXT_BUTTON_XPATH,
  PAGE_LOAD_WAIT_MS,
  PASSWORD_SELECTOR_CSS,
  PRIMARY_COLUMN_SELECTOR_CSS,
  SCREENSHOTS_DIR_RELATIVE,
  SHORT_DELAY_MAX,
  SHORT_DELAY_MIN,
  TIME_SELECTOR_CSS,
  TWEET_ARTICLE_SELECTOR_CSS,
  TWEET_TEXT_SELECTOR_CSS,
  USERNAME_VERIFICATION_SELECTOR_CSS,
  X_BASE_URL,
} from "./constants";
import { getAllXAccounts, saveTweets, saveXAccount } from "./db";
import { createChromeOptions } from "./driver-config"; // Import createChromeOptions
import { randomDelay } from "./utils";

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
      // 1. IMPORTANT: Replace this with the actual path to your desired Chrome profile directory.
      //    Examples:
      //    macOS: "/Users/YOUR_USERNAME/Library/Application Support/Google/Chrome/XScraperProfile"
      //    Windows: "C:/Users/YOUR_USERNAME/AppData/Local/Google/Chrome/User Data/XScraperProfile"
      //    Linux: "/home/YOUR_USERNAME/.config/google-chrome/XScraperProfile"
      const profilePath = DEFAULT_PROFILE_PATH_RELATIVE;

      const options = createChromeOptions(profilePath); // Use the imported function

      this.driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

      // Set script timeout
      await this.driver.manage().setTimeouts({ script: DEFAULT_SELENIUM_SCRIPT_TIMEOUT });

      // CDP経由で自動化フラグを変更
      // Refined script: Only attempt to redefine if navigator.webdriver is true.
      await this.driver.executeScript(`
        if (navigator.webdriver === true) {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true // Explicitly try to make it configurable
          });
        }
      `);

      // inject session cookies if present
      if (this.sessionCookies && this.sessionCookies.length > 0) {
        this.logger.info("XScraper", `Attempting to inject ${this.sessionCookies.length} session cookies.`);
        // navigate to base domain to apply cookies
        await this.driver.get(X_BASE_URL);
        for (const cookie of this.sessionCookies) {
          try {
            // cast to SeleniumCookie to satisfy overload
            await this.driver.manage().addCookie(cookie as SeleniumCookie);
            this.logger.debug(
              "XScraper",
              `Successfully added cookie for domain: ${cookie.domain}, name: ${cookie.name}`,
            );
          } catch (e) {
            this.logger.warn("XScraper", "Failed to add a session cookie", {
              cookieName: cookie.name,
              cookieDomain: cookie.domain,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }
        this.logger.info("XScraper", "Finished attempting to inject session cookies.");
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
      await driver.get(LOGIN_URL);

      // --- Find and interact with the initial input field (Email/Phone/Username) ---
      const initialInputSelector = By.css(INITIAL_INPUT_SELECTOR_CSS);

      try {
        this.logger.info("XScraper", `Waiting for initial input field (${initialInputSelector}) to be located...`);
        await driver.wait(until.elementLocated(initialInputSelector), ELEMENT_LOCATE_TIMEOUT_MS); // Increased timeout
        const emailOrUsernameInput = await driver.findElement(initialInputSelector);

        this.logger.info("XScraper", "Waiting for initial input field to be visible and enabled...");
        await driver.wait(until.elementIsVisible(emailOrUsernameInput), ELEMENT_LOCATE_TIMEOUT_MS); // Consistent timeout
        await driver.wait(until.elementIsEnabled(emailOrUsernameInput), ELEMENT_LOCATE_TIMEOUT_MS); // Consistent timeout

        this.logger.info("XScraper", "Initial input field located and ready. Entering email...");
        await emailOrUsernameInput.sendKeys(this.credentials.email);
        await driver.sleep(randomDelay(SHORT_DELAY_MIN, SHORT_DELAY_MAX));

        // Revert to clicking the "Next" button explicitly
        this.logger.info("XScraper", "Locating and clicking the Next button for initial input...");
        const nextButton = await driver.findElement(By.xpath(NEXT_BUTTON_XPATH));
        await driver.wait(until.elementIsEnabled(nextButton), ELEMENT_LOCATE_TIMEOUT_MS);
        await nextButton.click();
        this.logger.info("XScraper", "Initial input (email) submitted via Next button click.");

        // --- Wait for page transition after clicking Next ---
        this.logger.info("XScraper", "Waiting for page transition after submitting email...");
        const passwordSelector = By.css(PASSWORD_SELECTOR_CSS);
        const usernameVerificationSelector = By.css(USERNAME_VERIFICATION_SELECTOR_CSS);
        const expectedUrlPattern = /login\/(identifier|password)/;

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
          }, ELEMENT_LOCATE_TIMEOUT_MS * 4); // Longer timeout for page transition
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
            await driver.wait(until.elementLocated(usernameVerificationSelector), ELEMENT_LOCATE_TIMEOUT_MS / 2);
            const usernameInput = await driver.findElement(usernameVerificationSelector);
            await driver.wait(until.elementIsVisible(usernameInput), ELEMENT_LOCATE_TIMEOUT_MS / 2);
            await driver.wait(until.elementIsEnabled(usernameInput), ELEMENT_LOCATE_TIMEOUT_MS / 2);

            // A simple check: if a visible input[name='text'] exists here, assume it's username verification
            this.logger.info("XScraper", "Username verification step detected. Entering username...");
            await usernameInput.sendKeys(this.credentials.username);
            await driver.sleep(randomDelay(SHORT_DELAY_MIN, SHORT_DELAY_MAX));

            // Click the "Next" button explicitly for username step
            this.logger.info("XScraper", "Locating and clicking the Next button for username...");
            const usernameNextButton = await driver.findElement(By.xpath(NEXT_BUTTON_XPATH));
            await driver.wait(until.elementIsEnabled(usernameNextButton), ELEMENT_LOCATE_TIMEOUT_MS);
            await usernameNextButton.click();

            this.logger.info("XScraper", "Username submitted for verification via Next button click.");
            const urlAfterUsernameSubmit = await driver.getCurrentUrl();
            this.logger.info("XScraper", `URL after username submit: ${urlAfterUsernameSubmit}`);
            // Wait specifically for the password field after submitting username
            this.logger.info("XScraper", "Waiting for password field after username submission...");
            await driver.wait(until.elementLocated(passwordSelector), ELEMENT_LOCATE_TIMEOUT_MS * 3);
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
          await driver.wait(until.elementIsVisible(passwordInput), ELEMENT_LOCATE_TIMEOUT_MS);
          await driver.wait(until.elementIsEnabled(passwordInput), ELEMENT_LOCATE_TIMEOUT_MS);
          await driver.sleep(randomDelay(SHORT_DELAY_MIN, SHORT_DELAY_MAX));
          await passwordInput.sendKeys(this.credentials.password);
          await driver.sleep(randomDelay(SHORT_DELAY_MIN, SHORT_DELAY_MAX));
          await passwordInput.sendKeys(Key.RETURN);
          this.logger.info("XScraper", "Password submitted.");
          // Add a significant delay after password submission to appear less suspicious
          await driver.sleep(randomDelay(LOGIN_SUCCESS_DELAY_MIN, LOGIN_SUCCESS_DELAY_MAX));
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
        await driver.sleep(randomDelay(LONG_DELAY_MIN, LONG_DELAY_MAX)); // Keep a small delay before the main wait
        await driver.wait(until.elementLocated(By.css(PRIMARY_COLUMN_SELECTOR_CSS)), ELEMENT_LOCATE_TIMEOUT_MS * 4.5);
        this.logger.info("XScraper", "Login successful");

        // store cookies for reuse in child instances
        try {
          this.sessionCookies = await driver.manage().getCookies();
          this.saveCookies(this.sessionCookies);
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

      const url = `${X_BASE_URL}/${xId}`;

      // ページに移動
      this.logger.debug("XScraper", `Navigating to ${url}`);
      await driver.get(url);

      // Xのページが完全に読み込まれるのを十分な時間待つ
      await driver.sleep(PAGE_LOAD_WAIT_MS);

      // ページが読み込まれるのを待つ
      await driver.wait(until.elementLocated(By.css(TWEET_ARTICLE_SELECTOR_CSS)), ELEMENT_LOCATE_TIMEOUT_MS);

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
   * Gets the tweet URL by navigation: click the time element, read current URL, then navigate back.
   */
  private async getTweetUrlViaNavigation(driver: WebDriver, tweetElement: WebElement): Promise<string> {
    let url = "";
    const originalPageUrl = await driver.getCurrentUrl(); // For checking if navigation actually happened
    try {
      const timeElem = await tweetElement.findElement(By.css(TIME_SELECTOR_CSS));
      // Use JavaScript click for potentially more stable interaction
      await driver.executeScript("arguments[0].click();", timeElem);

      // Wait until URL changes and contains '/status/'
      await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
        return currentUrl !== originalPageUrl && /\/status\//.test(currentUrl);
      }, ELEMENT_LOCATE_TIMEOUT_MS + 5000); // Increased timeout for navigation

      url = await driver.getCurrentUrl();
      this.logger.debug("XScraper", `Navigated to tweet detail page: ${url}`);
    } catch (e) {
      this.logger.error("XScraper", "Navigation-based URL fetch failed", {
        error: e instanceof Error ? e.message : String(e),
        currentUrl: await driver.getCurrentUrl().catch(() => "unknown"),
      });
      await this.captureFailureScreenshot("getTweetUrlViaNavigation_fail");
    } finally {
      try {
        const currentUrlAfterAttempt = await driver.getCurrentUrl();
        // Only navigate back if we are on a status page (implying successful navigation)
        if (/\/status\//.test(currentUrlAfterAttempt) && currentUrlAfterAttempt !== originalPageUrl) {
          this.logger.debug("XScraper", `Navigating back from ${currentUrlAfterAttempt}`);
          await driver.navigate().back();
          this.logger.debug("XScraper", "Waiting for timeline to reload after navigating back...");
          // Wait for a general page element first, then for tweet articles
          await driver.wait(until.elementLocated(By.css(PRIMARY_COLUMN_SELECTOR_CSS)), PAGE_LOAD_WAIT_MS);
          await driver.wait(until.elementLocated(By.css(TWEET_ARTICLE_SELECTOR_CSS)), ELEMENT_LOCATE_TIMEOUT_MS);
          this.logger.debug("XScraper", "Timeline reloaded.");
        } else {
          this.logger.debug(
            "XScraper",
            "Not on a status page or URL didn't change, no back navigation needed from getTweetUrlViaNavigation.",
          );
        }
      } catch (navBackError) {
        this.logger.warn(
          "XScraper",
          "Error during navigation back or waiting for timeline reload in getTweetUrlViaNavigation",
          {
            error: navBackError instanceof Error ? navBackError.message : String(navBackError),
          },
        );
        await this.captureFailureScreenshot("getTweetUrlViaNavigation_navBack_fail");
        // Attempt to recover by going to the base URL if back navigation fails badly
        try {
          await driver.get(X_BASE_URL + "/home");
          await driver.wait(until.elementLocated(By.css(PRIMARY_COLUMN_SELECTOR_CSS)), PAGE_LOAD_WAIT_MS);
        } catch (recoveryError) {
          this.logger.error("XScraper", "Failed to recover by navigating to home.", recoveryError);
        }
      }
    }
    return url;
  }

  /**
   * ドライバーからツイートを抽出
   */
  private async extractTweets(driver: WebDriver): Promise<Tweet[]> {
    const tweets: Tweet[] = [];
    let currentTweetIndexOnPage = 0;
    // Using datetime from tweet or a timestamp as a temporary identifier to avoid reprocessing due to DOM refresh
    const processedTweetIdentifiers = new Set<string>();

    // Loop a limited number of times to find tweets
    for (
      let attempt = 0;
      tweets.length < MAX_TWEETS_TO_PROCESS_PER_ACCOUNT && attempt < MAX_TWEETS_TO_PROCESS_PER_ACCOUNT * 2;
      attempt++
    ) {
      let articles: WebElement[];
      try {
        // Re-fetch tweet articles in each iteration to get fresh elements
        await driver.wait(until.elementLocated(By.css(TWEET_ARTICLE_SELECTOR_CSS)), ELEMENT_LOCATE_TIMEOUT_MS);
        articles = await driver.findElements(By.css(TWEET_ARTICLE_SELECTOR_CSS));
        this.logger.debug(
          "XScraper",
          `Found ${articles.length} tweet articles on page. Attempting to process article at index ${currentTweetIndexOnPage}. Total tweets collected: ${tweets.length}`,
        );

        if (currentTweetIndexOnPage >= articles.length) {
          this.logger.info(
            "XScraper",
            `Reached end of currently visible tweets (index ${currentTweetIndexOnPage}/${articles.length}). Trying to scroll.`,
          );
          // Attempt to scroll to load more tweets
          await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
          await driver.sleep(randomDelay(MEDIUM_DELAY_MIN, MEDIUM_DELAY_MAX + 1000)); // Wait longer for content to load after scroll

          const articlesAfterScroll = await driver.findElements(By.css(TWEET_ARTICLE_SELECTOR_CSS));
          if (articlesAfterScroll.length > articles.length) {
            this.logger.info(
              "XScraper",
              `Scrolled and loaded ${articlesAfterScroll.length - articles.length} new articles.`,
            );
            articles = articlesAfterScroll; // Use the new list
            // currentTweetIndexOnPage might remain the same if new content is appended and old content shifts
            // or it might need to be adjusted. For simplicity, we continue with currentTweetIndexOnPage.
            // If it was at the end, and new items are loaded, it should pick them up.
          } else {
            this.logger.info("XScraper", "Scroll did not load new articles or no articles found. Stopping.");
            break;
          }
          // Re-check if current index is valid after scroll and potential new articles
          if (currentTweetIndexOnPage >= articles.length) {
            this.logger.info("XScraper", "Still at the end of articles after scroll. Stopping.");
            break;
          }
        }
      } catch (e) {
        this.logger.error("XScraper", "Failed to find tweet articles list", {
          error: e instanceof Error ? e.message : String(e),
        });
        break; // Stop if we can't even find the list of articles
      }

      const el = articles[currentTweetIndexOnPage];

      try {
        const timeElem = await el.findElement(By.css(TIME_SELECTOR_CSS));
        const time = await timeElem.getAttribute("datetime");

        const tweetMomentIdentifier = time || `no_time_idx_${currentTweetIndexOnPage}_${Date.now()}`;
        if (processedTweetIdentifiers.has(tweetMomentIdentifier)) {
          this.logger.debug(
            "XScraper",
            `Tweet with identifier ${tweetMomentIdentifier} already processed or marked, skipping.`,
          );
          currentTweetIndexOnPage++;
          continue; // Move to the next element in the *current* list for this attempt
        }

        let data = "";
        const textNodes = await el.findElements(By.css(TWEET_TEXT_SELECTOR_CSS));
        if (textNodes.length > 0) {
          for (const node of textNodes) {
            data += `${await node.getText()} `;
          }
        } else {
          // Fallback for tweets that might not have the standard text structure (e.g., only images, videos)
          // or where text is structured differently. This selector might need adjustment.
          const langNodes = await el.findElements(By.css(LANG_SELECTOR_CSS)); // This is a generic lang attribute selector, might not be ideal
          for (const node of langNodes) {
            data += `${await node.getText()} `;
          }
        }
        data = data.trim();

        if (!time || !data) {
          this.logger.warn("XScraper", "Skipping tweet due to missing time or text data before URL fetch.", {
            time,
            dataPresent: !!data,
            index: currentTweetIndexOnPage,
          });
          processedTweetIdentifiers.add(tweetMomentIdentifier); // Mark as processed even if skipped here
          currentTweetIndexOnPage++;
          continue;
        }

        // 'el' is from the fresh 'articles' list obtained at the start of this iteration
        const tweetUrl = await this.getTweetUrlViaNavigation(driver, el);

        if (time && data && tweetUrl) {
          tweets.push({ time, data, url: tweetUrl });
          processedTweetIdentifiers.add(tweetMomentIdentifier); // Mark as successfully processed
          this.logger.info(
            "XScraper",
            `Successfully extracted tweet (${tweets.length}/${MAX_TWEETS_TO_PROCESS_PER_ACCOUNT}): ${tweetUrl}`,
          );
        } else {
          this.logger.warn("XScraper", "Skipping tweet due to missing time, data, or URL after fetch attempt.", {
            time,
            dataPresent: !!data,
            tweetUrlFetched: tweetUrl,
            index: currentTweetIndexOnPage,
          });
          processedTweetIdentifiers.add(tweetMomentIdentifier); // Mark as processed to avoid retrying this problematic one indefinitely
        }
        currentTweetIndexOnPage++; // Move to the next tweet element for the next attempt cycle
      } catch (e) {
        this.logger.error(
          "XScraper",
          `Failed to extract single tweet detail for article at apparent index ${currentTweetIndexOnPage}`,
          {
            error: e instanceof Error ? e.message : String(e),
          },
        );
        // Mark the current index as problematic for this attempt to avoid infinite loops on the same broken element
        const problematicIdentifier = await el
          .findElement(By.css(TIME_SELECTOR_CSS))
          .getAttribute("datetime")
          .catch(() => `error_idx_${currentTweetIndexOnPage}_${Date.now()}`);
        processedTweetIdentifiers.add(problematicIdentifier);

        if (e instanceof Error && e.name === "StaleElementReferenceError") {
          this.logger.warn(
            "XScraper",
            `Stale element for tweet at index ${currentTweetIndexOnPage}. The list will be re-fetched.`,
          );
          // Don't increment currentTweetIndexOnPage, allow re-fetch to try the "same" logical position
          // if the element simply disappeared. Loop 'attempt' will increment.
        } else {
          // For other errors, increment to try the next element in the next attempt's fresh list
          currentTweetIndexOnPage++;
        }
      }
    }
    // Sort tweets by newest first before returning
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
  public async checkXAccounts(batchSizeForLoggingOrDelay: number = 1): Promise<string[]> {
    if (!this.driver) {
      this.logger.info("XScraper", "Initializing driver for checkXAccounts");
      await this.initDriver();
      if (!this.driver) {
        this.logger.error("XScraper", "Failed to initialize driver in checkXAccounts.");
        return [];
      }
    } else {
      this.logger.info("XScraper", "Driver already initialized for checkXAccounts.");
    }

    // Load cookies and attempt to use existing session
    this.loadCookies();
    if (this.sessionCookies && this.sessionCookies.length > 0 && !this.areCookiesExpired(this.sessionCookies)) {
      this.logger.info("XScraper", "Cookies are not expired. Attempting to use session.");
      // Session cookies are injected during initDriver if present
      // Verify session by navigating to home and checking for login state
      try {
        await this.driver.get(X_BASE_URL + "/home");
        // Use PRIMARY_COLUMN_SELECTOR_CSS to confirm the main feed has loaded, indicating a successful session/login.
        await this.driver.wait(until.elementLocated(By.css(PRIMARY_COLUMN_SELECTOR_CSS)), PAGE_LOAD_WAIT_MS);
        this.logger.info("XScraper", "Session appears active with loaded cookies. Skipping login.");
      } catch (e) {
        this.logger.warn(
          "XScraper",
          "Session not active with cookies or home page did not load as expected. Proceeding to login.",
          e,
        );
        this.sessionCookies = []; // Clear potentially invalid cookies
        if (!(await this.login())) {
          this.logger.error("XScraper", "Login failed in checkXAccounts after cookie check.");
          return [];
        }
      }
    } else {
      if (this.sessionCookies && this.sessionCookies.length > 0 && this.areCookiesExpired(this.sessionCookies)) {
        this.logger.info("XScraper", "Session cookies are expired.");
        this.sessionCookies = []; // Clear expired cookies
      } else {
        this.logger.info("XScraper", "No valid session cookies found.");
      }
      if (!(await this.login())) {
        this.logger.error("XScraper", "Login failed in checkXAccounts.");
        return [];
      }
    }

    const accounts = await getAllXAccounts();
    if (accounts.length === 0) {
      this.logger.warn("XScraper", "No X accounts found in the database.");
      return [];
    }

    this.logger.info(
      "XScraper",
      `Starting account checking sequentially. Batch size for logging/delay: ${batchSizeForLoggingOrDelay}`,
    );

    const updatedAccountIds: string[] = [];

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      this.logger.info("XScraper", `Processing account ${i + 1}/${accounts.length}: ${account.id}`);

      try {
        // Ensure driver is available for checkSingleAccount
        if (!this.driver) throw new Error("Driver became unavailable before checkSingleAccount");
        const changedTweetId = await this.checkSingleAccount(account.id);
        if (changedTweetId) {
          this.logger.info("XScraper", `Change detected for ${account.id}. New latest tweet ID: ${changedTweetId}`);
          updatedAccountIds.push(account.id);
        } else {
          this.logger.info("XScraper", `No new tweets or change detected for ${account.id}`);
        }
      } catch (err) {
        this.logger.error("XScraper", `Error scraping ${account.id}:`, {
          error: err instanceof Error ? err.message : String(err),
        });
        if (this.driver) {
          await this.captureFailureScreenshot(`checkXAccounts_error_${account.id}`);
        }
        // Attempt to recover for the next account by navigating to a known state
        if (this.driver) {
          try {
            this.logger.info("XScraper", `Attempting to recover driver by navigating to ${X_BASE_URL}/home`);
            await this.driver.get(X_BASE_URL + "/home");
            await this.driver.wait(until.elementLocated(By.css(PRIMARY_COLUMN_SELECTOR_CSS)), PAGE_LOAD_WAIT_MS);
          } catch (recoveryError) {
            this.logger.error(
              "XScraper",
              `Failed to recover driver state for account ${account.id}. Subsequent accounts might be affected.`,
              recoveryError,
            );
            // If recovery fails, it might be best to stop or re-initialize the driver
            // For now, we'll let it continue and hope for the best for the next account.
          }
        }
      }

      // Add delay if processing in "batches" for logging/rate-limiting reasons
      if ((i + 1) % batchSizeForLoggingOrDelay === 0 && i + 1 < accounts.length) {
        const waitTime = BATCH_PROCESSING_WAIT_MS;
        this.logger.debug(
          "XScraper",
          `Waiting ${waitTime}ms before next account (after batch of ${batchSizeForLoggingOrDelay})...`,
        );
        if (this.driver) {
          await this.driver.sleep(waitTime);
        } else {
          // Fallback if driver is somehow null
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    this.logger.info(
      "XScraper",
      `Finished checking all X accounts. Total updated accounts: ${updatedAccountIds.length}`,
    );
    return updatedAccountIds;
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
    const dir = path.resolve(process.cwd(), COOKIES_DIR_RELATIVE);
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, COOKIES_FILENAME);
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
    const dir = path.resolve(process.cwd(), SCREENSHOTS_DIR_RELATIVE);
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

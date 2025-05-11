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
   * Initializes a new WebDriver instance or returns the existing one if `reuseExistingInstance` is true.
   * If `sessionCookiesToInject` are provided, they will be injected into the new instance.
   *
   * @param reuseExistingInstance If true, returns this.driver if it exists. Otherwise, always creates a new one if this.driver is null, or if reuseExistingInstance is false.
   * @param cookiesToInject Optional. Cookies to inject into a new driver instance.
   * @returns A promise that resolves to a WebDriver instance, or null if creation fails.
   */
  private async initDriver(
    reuseExistingInstance: boolean = false,
    cookiesToInject?: SeleniumCookie[],
  ): Promise<WebDriver | null> {
    if (reuseExistingInstance && this.driver) {
      this.logger.info("XScraper", "Reusing existing WebDriver instance for main operations.");
      // If reusing, and cookiesToInject are provided, prefer them. Otherwise, it might have already been handled or rely on this.sessionCookies.
      // This logic might need refinement based on exact cookie management strategy for reused instances.
      // For now, assume if reusing, cookies are either already set or will be handled by ensureLoggedIn if this.sessionCookies is updated.
      // For now, assume if reusing, cookies are either already set or will be handled by ensureLoggedIn if this.sessionCookies is updated.
      return this.driver;
    }

    this.logger.info("XScraper", "Initializing new Selenium WebDriver instance.");
    let newDriver: WebDriver | null = null;

    try {
      const options = createChromeOptions();
      newDriver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();
      await newDriver.manage().setTimeouts({ script: DEFAULT_SELENIUM_SCRIPT_TIMEOUT });

      await newDriver.executeScript(`
        if (navigator.webdriver === true) {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
          });
        }
      `);

      // Determine which cookies to inject.
      // If cookiesToInject is provided, use that.
      // Else, if reusing and this.sessionCookies exist, initDriver might have been called after loading them, so use them.
      // Else, no cookies to inject at this stage.
      const effectiveCookiesToInject =
        cookiesToInject || (reuseExistingInstance && this.sessionCookies ? this.sessionCookies : []);

      if (effectiveCookiesToInject && effectiveCookiesToInject.length > 0) {
        this.logger.info(
          "XScraper",
          `Attempting to inject ${effectiveCookiesToInject.length} cookies into new driver instance.`,
        );
        await newDriver.get(X_BASE_URL); // Navigate to base domain to apply cookies
        for (const cookie of effectiveCookiesToInject) {
          if (cookie.name && cookie.value && cookie.domain) {
            try {
              await newDriver.manage().addCookie(cookie as SeleniumCookie);
              this.logger.debug(
                "XScraper",
                `Successfully added cookie: ${cookie.name} for domain: ${cookie.domain} to new driver`,
              );
            } catch (addCookieError) {
              this.logger.warn("XScraper", "Failed to add a session cookie to new driver", {
                cookieName: cookie.name,
                error: addCookieError,
              });
            }
          } else {
            this.logger.warn("XScraper", "Skipping malformed cookie for new driver", { cookie });
          }
        }
        this.logger.info("XScraper", "Finished attempting to inject cookies into new driver.");
        // Verify by navigating to home, helps session stick
        await newDriver.get(X_BASE_URL + "/home");
        await newDriver.wait(until.elementLocated(By.css(PRIMARY_COLUMN_SELECTOR_CSS)), PAGE_LOAD_WAIT_MS);
        this.logger.info("XScraper", "Cookie injection and navigation to /home successful for new driver.");
      }

      // Assign to the class member only if this instance is meant for main, shared operations
      if (reuseExistingInstance) {
        this.driver = newDriver;
      }

      return newDriver; // Return the newly created (or existing if logic was different) driver
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error("XScraper", "Failed to initialize WebDriver instance", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      if (newDriver) {
        try {
          await newDriver.quit();
        } catch {
          /* ignore quit error */
        }
      }
      // If this was an attempt to set the main shared driver and it failed, ensure this.driver is null.
      if (reuseExistingInstance) {
        this.driver = null;
      }
      return null; // Indicate failure
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
      // Call initDriver to get the main driver instance for login
      // The 'true' argument for reuseExistingInstance implies we want to set/use this.driver
      driver = await this.initDriver(true);

      if (!driver) {
        this.logger.error("XScraper", "Failed to initialize driver for login process. Aborting login.");
        // No screenshot here as driver is null
        return false;
      }
      // From this point, 'driver' can be treated as WebDriver (not null)

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
      if (driver) {
        // Check if driver is not null before capturing screenshot
        await this.captureFailureScreenshot(driver, "login");
      }
      return false;
    }
  }

  /**
   * 単一のXアカウントをチェック
   * @returns {Promise<string | null>} 変更があった場合は最新のツイートID、なければnull
   */
  public async checkSingleAccount(xId: string): Promise<string | null> {
    const driver = await this.initDriver(); // This line is removed as driver is now passed as an argument

    if (!driver) {
      this.logger.error("XScraper", "Driver not found");
      return null;
    }

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
        await this.captureFailureScreenshot(driver, "checkSingleAccount_no_tweets"); // Pass driver
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
      await this.captureFailureScreenshot(driver, `checkSingleAccount_error_${xId}`); // Pass driver
      return null;
    }
  }

  /**
   * Gets the tweet URL by navigation: click the time element, read current URL, then navigate back.
   */
  private async getTweetUrlViaNavigation(driver: WebDriver, tweetElement: WebElement): Promise<string> {
    let url = "";
    const originalPageUrl = await driver.getCurrentUrl(); // For checking if navigation actually happened
    this.logger.debug("XScraper", `Attempting to navigate from ${originalPageUrl} to get tweet URL.`);
    try {
      const timeElem = await tweetElement.findElement(By.css(TIME_SELECTOR_CSS));
      // Use JavaScript click for potentially more stable interaction with elements that might be obscured
      await driver.executeScript("arguments[0].click();", timeElem);

      // Wait until URL changes from original AND contains '/status/', indicating successful navigation to a tweet detail page
      await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
        return currentUrl !== originalPageUrl && /\/status\//.test(currentUrl);
      }, ELEMENT_LOCATE_TIMEOUT_MS + 5000); // Increased timeout for page navigation

      url = await driver.getCurrentUrl();
      this.logger.info("XScraper", `Successfully navigated to tweet detail page: ${url}`);
    } catch (e) {
      this.logger.error("XScraper", "Navigation-based URL fetch failed (time element click or subsequent wait)", {
        error: e instanceof Error ? e.message : String(e),
        originalUrl: originalPageUrl,
        currentUrlAttempt: await driver.getCurrentUrl().catch(() => "failed to get current URL"),
      });
      await this.captureFailureScreenshot(driver, "getTweetUrlViaNavigation_nav_fail");
      // URL remains empty if navigation fails
    } finally {
      const urlAfterNavigationAttempt = await driver.getCurrentUrl().catch(() => originalPageUrl); // Default to original if error
      this.logger.debug(
        "XScraper",
        `In finally block for getTweetUrlViaNavigation. URL after nav attempt: ${urlAfterNavigationAttempt}`,
      );

      // Attempt to navigate back only if we actually navigated away to a tweet status page
      if (urlAfterNavigationAttempt !== originalPageUrl && /\/status\//.test(urlAfterNavigationAttempt)) {
        this.logger.debug(
          "XScraper",
          `Attempting to navigate back from tweet detail page: ${urlAfterNavigationAttempt}`,
        );
        try {
          await driver.navigate().back();
          this.logger.debug("XScraper", "Waiting for timeline to reload after navigating back...");
          // Wait for primary column, then for tweet articles to ensure page is ready
          await driver.wait(until.elementLocated(By.css(PRIMARY_COLUMN_SELECTOR_CSS)), PAGE_LOAD_WAIT_MS);
          await driver.wait(until.elementLocated(By.css(TWEET_ARTICLE_SELECTOR_CSS)), ELEMENT_LOCATE_TIMEOUT_MS);
          this.logger.info("XScraper", "Successfully navigated back and timeline reloaded.");
        } catch (navBackError) {
          this.logger.warn(
            "XScraper",
            "Failed to navigate back or timeline did not reload as expected. Attempting recovery.",
            {
              error: navBackError instanceof Error ? navBackError.message : String(navBackError),
              urlBeforeRecoveryAttempt: await driver.getCurrentUrl().catch(() => "unknown"),
            },
          );
          await this.captureFailureScreenshot(driver, "getTweetUrlViaNavigation_navBack_fail"); // Pass driver
          // Recovery attempt: Navigate to the home page to stabilize state for next operations
          try {
            this.logger.info("XScraper", `Recovery: Navigating to ${X_BASE_URL}/home.`);
            await driver.get(X_BASE_URL + "/home");
            await driver.wait(until.elementLocated(By.css(PRIMARY_COLUMN_SELECTOR_CSS)), PAGE_LOAD_WAIT_MS);
            await driver.wait(until.elementLocated(By.css(TWEET_ARTICLE_SELECTOR_CSS)), ELEMENT_LOCATE_TIMEOUT_MS);
            this.logger.info("XScraper", "Recovery to /home successful.");
          } catch (recoveryError) {
            this.logger.error(
              "XScraper",
              "Recovery attempt to /home failed critically. Subsequent operations may be unstable.",
              {
                error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
              },
            );
            await this.captureFailureScreenshot(driver, "getTweetUrlViaNavigation_recovery_fail"); // Pass driver
            // If recovery fails, the scraper might be in an unrecoverable state for the current driver session.
          }
        }
      } else {
        this.logger.debug(
          "XScraper",
          "No back navigation performed: either still on original page or not on a status page.",
          {
            originalPageUrl,
            urlAfterNavigationAttempt,
          },
        );
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
    const processedTweetIdentifiers = new Set<string>(); // Stores datetime or unique ID of processed/skipped tweets to avoid reprocessing
    let consecutiveScrollsWithoutNewContent = 0;
    const MAX_CONSECUTIVE_SCROLLS_WITHOUT_NEW_CONTENT = 3; // Max attempts to scroll if no new tweets are found
    let articlesOnPageCount = 0; // Keep track of articles seen in the current view before attempting to process/scroll

    // Main loop: Continue as long as we haven't hit the processing limit AND (there are more articles to process OR we can still attempt to scroll)
    for (
      let attempt = 0;
      tweets.length < MAX_TWEETS_TO_PROCESS_PER_ACCOUNT && attempt < MAX_TWEETS_TO_PROCESS_PER_ACCOUNT * 3;
      attempt++
    ) {
      let articles: WebElement[];
      try {
        // Re-fetch tweet articles in each iteration to ensure freshness, especially after navigation or DOM changes
        await driver.wait(until.elementLocated(By.css(TWEET_ARTICLE_SELECTOR_CSS)), ELEMENT_LOCATE_TIMEOUT_MS);
        articles = await driver.findElements(By.css(TWEET_ARTICLE_SELECTOR_CSS));
        articlesOnPageCount = articles.length;
        this.logger.debug(
          "XScraper",
          `Found ${articlesOnPageCount} tweet articles on page. Attempting to process article at index ${currentTweetIndexOnPage}. Total tweets collected: ${tweets.length}`,
        );

        // Check if we need to scroll for more tweets
        if (currentTweetIndexOnPage >= articlesOnPageCount) {
          if (consecutiveScrollsWithoutNewContent >= MAX_CONSECUTIVE_SCROLLS_WITHOUT_NEW_CONTENT) {
            this.logger.info(
              "XScraper",
              "Max consecutive scrolls without new content reached. Stopping tweet extraction for this page.",
            );
            break; // Exit main loop
          }
          this.logger.info(
            "XScraper",
            `Reached end of ${articlesOnPageCount} visible tweets. Attempting to scroll (attempt ${consecutiveScrollsWithoutNewContent + 1}).`,
          );
          await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
          await driver.sleep(randomDelay(MEDIUM_DELAY_MIN + 1000, MEDIUM_DELAY_MAX + 2000)); // Longer wait after scroll

          const articlesAfterScroll = await driver.findElements(By.css(TWEET_ARTICLE_SELECTOR_CSS));
          if (articlesAfterScroll.length > articlesOnPageCount) {
            this.logger.info(
              "XScraper",
              `Scrolled and loaded ${articlesAfterScroll.length - articlesOnPageCount} new articles. Total now: ${articlesAfterScroll.length}`,
            );
            articles = articlesAfterScroll; // Update articles with the new list
            articlesOnPageCount = articles.length; // Update count
            consecutiveScrollsWithoutNewContent = 0; // Reset counter
            // currentTweetIndexOnPage remains, as new content is typically appended
          } else {
            this.logger.info(
              "XScraper",
              "Scroll did not load new articles or no articles found. Incrementing no-new-content scroll counter.",
            );
            consecutiveScrollsWithoutNewContent++;
          }
          // Re-check if current index is valid after scroll and potential new articles
          if (currentTweetIndexOnPage >= articlesOnPageCount) {
            this.logger.info(
              "XScraper",
              `Still no more articles to process at index ${currentTweetIndexOnPage} after scroll. Total visible: ${articlesOnPageCount}.`,
            );
            // If scrolls are exhausted, the outer loop will break. If not, it will try to scroll again.
            continue; // Try scrolling again or exit if scroll attempts exhausted
          }
        }
      } catch (e) {
        this.logger.error("XScraper", "Failed to find or list tweet articles during an extraction attempt.", {
          error: e instanceof Error ? e.message : String(e),
        });
        await this.captureFailureScreenshot(driver, "extractTweets_articleList_fail"); // Pass driver
        break; // Critical error finding articles, stop extraction for this account
      }

      // If, after attempting to scroll, we still don't have an article at currentTweetIndexOnPage, break.
      if (currentTweetIndexOnPage >= articlesOnPageCount) {
        this.logger.info(
          "XScraper",
          `No article at index ${currentTweetIndexOnPage} after scroll attempts (total visible ${articlesOnPageCount}). Ending extraction.`,
        );
        break;
      }

      const el = articles[currentTweetIndexOnPage];
      let tweetTime = "";
      let tweetMomentIdentifier = `no_time_idx_${currentTweetIndexOnPage}_${Date.now()}`;

      try {
        // Attempt to get time first for the identifier
        try {
          const timeElem = await el.findElement(By.css(TIME_SELECTOR_CSS));
          tweetTime = await timeElem.getAttribute("datetime");
          if (tweetTime) {
            tweetMomentIdentifier = tweetTime; // Use actual datetime as identifier if available
          }
        } catch (timeError) {
          this.logger.warn(
            "XScraper",
            `Could not find time element for article at index ${currentTweetIndexOnPage}. Using fallback identifier.`,
            { error: timeError instanceof Error ? timeError.message : "Unknown time error" },
          );
          // tweetMomentIdentifier remains the fallback
        }

        if (processedTweetIdentifiers.has(tweetMomentIdentifier)) {
          this.logger.debug(
            "XScraper",
            `Tweet with identifier '${tweetMomentIdentifier}' (index ${currentTweetIndexOnPage}) already processed/skipped, moving to next.`,
          );
          currentTweetIndexOnPage++;
          attempt--; // Decrement attempt because this wasn't a real processing attempt, just a skip
          continue;
        }

        let tweetText = "";
        const textNodes = await el.findElements(By.css(TWEET_TEXT_SELECTOR_CSS));
        if (textNodes.length > 0) {
          for (const node of textNodes) {
            tweetText += `${await node.getText()} `;
          }
        } else {
          const langNodes = await el.findElements(By.css(LANG_SELECTOR_CSS));
          if (langNodes.length > 0) {
            for (const node of langNodes) {
              tweetText += `${await node.getText()} `;
            }
          } else {
            this.logger.warn(
              "XScraper",
              `No text found using primary or fallback selectors for tweet at index ${currentTweetIndexOnPage}. Identifier: ${tweetMomentIdentifier}`,
            );
            // Tweet might be an image/video only, or unusual format. Text will be empty.
          }
        }
        tweetText = tweetText.trim();

        if (!tweetTime || !tweetText) {
          this.logger.warn(
            "XScraper",
            "Skipping tweet due to missing time or text data (even if only whitespace) before URL fetch.",
            {
              time: tweetTime,
              textPresent: !!tweetText,
              index: currentTweetIndexOnPage,
              identifier: tweetMomentIdentifier,
            },
          );
          processedTweetIdentifiers.add(tweetMomentIdentifier); // Mark as processed to avoid re-evaluating
          currentTweetIndexOnPage++;
          continue;
        }

        // Get tweet URL - this involves navigation, so 'el' might become stale if not careful.
        // However, 'el' is from the 'articles' list re-fetched at the start of this outer loop iteration.
        const tweetUrl = await this.getTweetUrlViaNavigation(driver, el);

        if (tweetUrl) {
          // Check if URL was successfully fetched
          tweets.push({ time: tweetTime, data: tweetText, url: tweetUrl });
          processedTweetIdentifiers.add(tweetMomentIdentifier);
          this.logger.info(
            "XScraper",
            `Successfully extracted tweet (${tweets.length}/${MAX_TWEETS_TO_PROCESS_PER_ACCOUNT}): ${tweetUrl}`,
          );
        } else {
          this.logger.warn("XScraper", "Skipping tweet because URL could not be fetched.", {
            time: tweetTime,
            text: tweetText,
            index: currentTweetIndexOnPage,
            identifier: tweetMomentIdentifier,
          });
          processedTweetIdentifiers.add(tweetMomentIdentifier); // Mark as processed even if URL fetch failed, to avoid retrying this problematic one.
        }
        currentTweetIndexOnPage++;
      } catch (e) {
        this.logger.error(
          "XScraper",
          `Critical error processing single tweet detail for article at index ${currentTweetIndexOnPage}. Identifier: ${tweetMomentIdentifier}`,
          {
            error: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : undefined,
          },
        );
        processedTweetIdentifiers.add(tweetMomentIdentifier); // Ensure problematic tweet is marked
        await this.captureFailureScreenshot(driver, `extractTweets_single_tweet_fail_idx${currentTweetIndexOnPage}`); // Pass driver

        if (e instanceof Error && e.name === "StaleElementReferenceError") {
          this.logger.warn(
            "XScraper",
            `StaleElementReferenceError for tweet at index ${currentTweetIndexOnPage}. List will be re-fetched in next attempt. Identifier: ${tweetMomentIdentifier}`,
          );
          // Don't increment currentTweetIndexOnPage if stale, outer loop re-fetches and current index effectively retries on fresh list.
          // However, the 'attempt' counter for the main loop will increment.
        } else {
          // For other errors, assume this specific tweet element is unprocessable, move to the next one.
          currentTweetIndexOnPage++;
        }
      }
    }
    this.logger.info("XScraper", `Finished extraction attempt. Total tweets collected: ${tweets.length}`);
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

      if (this.driver) {
        // 初回チェックを実施
        await this.checkSingleAccount(xId);
      }

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
  public async checkXAccounts(maxConcurrency: number = 10): Promise<string[]> {
    // Ensure a logged-in state and get session cookies for parallel instances
    const isLoggedIn = await this.ensureLoggedIn();
    if (!isLoggedIn || !this.sessionCookies || this.sessionCookies.length === 0) {
      this.logger.error(
        "XScraper",
        "Could not ensure logged-in state or no session cookies obtained. Aborting checkXAccounts.",
      );
      if (this.driver) await this.closeDriver();
      return [];
    }

    const masterSessionCookies = [...this.sessionCookies]; // Copy cookies for use in parallel instances
    this.logger.info(
      "XScraper",
      `Master session cookies obtained (${masterSessionCookies.length}). Closing main driver before starting parallel runs.`,
    );
    if (this.driver) {
      // Close the main driver instance used for login, it won't be used for checks
      await this.closeDriver();
    }

    const accounts = await getAllXAccounts();
    if (accounts.length === 0) {
      this.logger.warn("XScraper", "No X accounts found in the database.");
      return [];
    }

    this.logger.info(
      "XScraper",
      `Starting parallel account checking for ${accounts.length} accounts with max concurrency: ${maxConcurrency}`,
    );

    const updatedAccountIds: string[] = [];
    const settledResults = [];

    for (let i = 0; i < accounts.length; i += maxConcurrency) {
      const batch = accounts.slice(i, i + maxConcurrency);
      this.logger.info(
        "XScraper",
        `Processing batch ${Math.floor(i / maxConcurrency) + 1}/${Math.ceil(accounts.length / maxConcurrency)}: accounts ${accountIdsInBatch(batch)}`,
      );

      const batchPromises = batch.map(async (account) => {
        let parallelDriver: WebDriver | null = null;
        try {
          this.logger.debug("XScraper", `Initializing new driver for account: ${account.id}`);
          parallelDriver = await this.initDriver(false, masterSessionCookies as SeleniumCookie[]); // false: don't reuse, create new. Pass master cookies.
          if (!parallelDriver) {
            this.logger.error("XScraper", `Failed to initialize parallel driver for account ${account.id}.`);
            return { accountId: account.id, status: "failed", error: "Driver initialization failed" };
          }

          this.logger.info("XScraper", `Driver initialized for ${account.id}. Starting checkSingleAccount.`);
          const changedTweetId = await this.checkSingleAccount(account.id);
          if (changedTweetId) {
            this.logger.info(
              "XScraper",
              `Change detected for ${account.id} (parallel). New latest tweet ID: ${changedTweetId}`,
            );
            return { accountId: account.id, status: "fulfilled", value: account.id };
          } else {
            this.logger.info("XScraper", `No new tweets or change detected for ${account.id} (parallel)`);
            return { accountId: account.id, status: "fulfilled", value: null };
          }
        } catch (err) {
          this.logger.error("XScraper", `Error scraping ${account.id} in parallel:`, {
            error: err instanceof Error ? err.message : String(err),
          });
          if (parallelDriver) {
            // Use non-null assertion operator as a final attempt to satisfy the linter
            await this.captureFailureScreenshot(parallelDriver!, `checkXAccounts_parallel_error_${account.id}`);
          }
          return { accountId: account.id, status: "failed", error: err instanceof Error ? err.message : String(err) };
        } finally {
          if (parallelDriver) {
            this.logger.debug("XScraper", `Closing driver for account: ${account.id}`);
            await parallelDriver
              .quit()
              .catch((e) => this.logger.warn("XScraper", `Error quitting parallel driver for ${account.id}`, e));
          }
        }
      });

      // Wait for all promises in the current batch to settle
      const results = await Promise.allSettled(batchPromises);
      settledResults.push(...results);

      results.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value &&
          result.value.status === "fulfilled" &&
          result.value.value
        ) {
          updatedAccountIds.push(result.value.value);
        }
      });

      this.logger.info(
        "XScraper",
        `Finished processing batch. Batch results count: ${results.length}. Updated accounts so far: ${updatedAccountIds.length}`,
      );

      if (i + maxConcurrency < accounts.length) {
        const waitTime = BATCH_PROCESSING_WAIT_MS; // Use existing constant for delay between batches
        this.logger.debug("XScraper", `Waiting ${waitTime}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.logger.info(
      "XScraper",
      `Finished all parallel batches. Total accounts processed: ${accounts.length}. Total updated accounts: ${updatedAccountIds.length}`,
    );
    // Log all settled results for debugging if needed
    // this.logger.debug("XScraper", "All settled results:", settledResults);
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
  private async captureFailureScreenshot(driver: WebDriver, context: string): Promise<void> {
    const screenshotPath = this.getScreenshotPath(context);
    if (!driver) {
      this.logger.warn("XScraper", "captureFailureScreenshot called with null driver.");
      return;
    }
    try {
      const img = await driver.takeScreenshot();
      fs.writeFileSync(screenshotPath, img, "base64");
      this.logger.info("XScraper", `Screenshot saved to ${screenshotPath}`);
    } catch (err) {
      this.logger.error("XScraper", `Failed to capture ${context} screenshot`, err);
    }
  }

  /**
   * Ensures the scraper is logged into X.com.
   * It checks for existing valid session cookies first. If not found or invalid,
   * it attempts to perform a full login.
   * @returns {Promise<boolean>} True if a logged-in session is active, false otherwise.
   */
  private async ensureLoggedIn(): Promise<boolean> {
    this.logger.info("XScraper", "Ensuring logged-in session...");

    // 1. Initialize driver if it doesn't exist.
    //    If this.sessionCookies is already populated (e.g. from constructor or previous load),
    //    initDriver will attempt to inject them.
    if (!this.driver) {
      this.logger.info("XScraper", "Driver not initialized. Calling initDriver (reuseExisting) in ensureLoggedIn.");
      try {
        // For ensureLoggedIn, we always want to manage this.driver
        this.driver = await this.initDriver(true, this.sessionCookies || undefined);
        if (!this.driver) {
          this.logger.error("XScraper", "initDriver (reused) was called but this.driver is still null.");
          return false;
        }
      } catch (initError) {
        this.logger.error("XScraper", "initDriver failed during ensureLoggedIn.", { error: initError });
        return false;
      }
    }

    // 2. Try to load cookies from file if not already in this.sessionCookies
    if (!this.sessionCookies || this.sessionCookies.length === 0) {
      const loadedCookies = this.loadCookies();
      if (loadedCookies.length > 0) {
        this.logger.info("XScraper", `Loaded ${loadedCookies.length} cookies from file in ensureLoggedIn.`);
        this.sessionCookies = loadedCookies;
        // Need to re-initialize driver or at least set cookies on current driver
        // For simplicity, if driver exists, we'll try to add cookies.
        // A more robust way might be to close and re-init driver here if cookies were just loaded.
        // However, initDriver is designed to inject this.sessionCookies if they are present.
        // If driver was already initialized without cookies, and now we loaded them, we need to apply them.
        // This part might be redundant if initDriver is always called when this.sessionCookies changes state from empty to filled.
        // Let's assume initDriver handles this, or we explicitly re-init/apply.
        // For now, if driver exists, and we just loaded cookies, let's try navigating to X_BASE_URL to help apply them.
        try {
          this.logger.info("XScraper", "Re-evaluating session with newly loaded cookies from file.");
          // To ensure cookies are applied, it's often best to re-navigate or ensure on right domain
          await this.driver.get(X_BASE_URL); // Go to base domain
          for (const cookie of this.sessionCookies) {
            if (cookie.name && cookie.value && cookie.domain) {
              try {
                await this.driver.manage().addCookie(cookie as SeleniumCookie);
              } catch (e) {
                /* ignore if already present or minor issue */
              }
            }
          }
          await this.driver.get(X_BASE_URL + "/home"); // Then verify
        } catch (reNavError) {
          this.logger.warn(
            "XScraper",
            "Error while trying to apply newly loaded cookies by re-navigating.",
            reNavError,
          );
          // If this fails, the session check below will likely fail, leading to login.
        }
      }
    }

    // 3. Check session validity (are cookies loaded, not expired, and do they work?)
    if (this.sessionCookies && this.sessionCookies.length > 0) {
      if (!this.areCookiesExpired(this.sessionCookies)) {
        this.logger.info("XScraper", "Session cookies found and are not expired. Verifying session activity...");
        try {
          // Ensure driver is on the home page to check for primary column
          const currentUrl = await this.driver.getCurrentUrl();
          if (!currentUrl.includes(X_BASE_URL + "/home")) {
            this.logger.info("XScraper", `Not on home page (${currentUrl}), navigating to verify session.`);
            await this.driver.get(X_BASE_URL + "/home");
          }
          // Wait for a known element that indicates logged-in state
          await this.driver.wait(until.elementLocated(By.css(PRIMARY_COLUMN_SELECTOR_CSS)), PAGE_LOAD_WAIT_MS);
          this.logger.info("XScraper", "Session is active and verified via /home page.");
          return true; // Session is active
        } catch (e) {
          this.logger.warn(
            "XScraper",
            "Cookies are present and not expired, but session verification failed (e.g., /home not loading correctly).",
            { error: e instanceof Error ? e.message : String(e) },
          );
          this.sessionCookies = []; // Clear invalid cookies
          if (this.driver) {
            // Check before capture
            await this.captureFailureScreenshot(this.driver, "session_verification_fail");
          }
        }
      } else {
        this.logger.info("XScraper", "Session cookies found but are expired.");
        this.sessionCookies = []; // Clear expired cookies
      }
    } else {
      this.logger.info("XScraper", "No session cookies found or they were cleared.");
    }

    // 4. If session is not active/verified, attempt login
    this.logger.info("XScraper", "Session not active or cookies invalid/expired. Attempting full login.");
    // Ensure any problematic driver state from cookie verification is cleared.
    // Closing and re-initializing the driver before a fresh login attempt can be more robust.
    if (this.driver) {
      await this.closeDriver(); // This sets this.driver to null
    }
    // Re-initialize driver for a clean login attempt, this should set this.driver
    this.driver = await this.initDriver(true);
    if (!this.driver) {
      this.logger.error("XScraper", "Failed to re-init this.driver before login attempt in ensureLoggedIn.");
      return false;
    }

    const loggedIn = await this.login(); // login() will use the newly initialized this.driver
    if (loggedIn) {
      this.logger.info("XScraper", "Login successful via ensureLoggedIn.");
      return true;
    } else {
      this.logger.error("XScraper", "Login failed via ensureLoggedIn.");
      if (this.driver) {
        // Check before capture
        await this.captureFailureScreenshot(this.driver, "ensureLoggedIn_login_fail");
      }
      return false;
    }
  }
}

function accountIdsInBatch(batch: { id: string }[]): string {
  return batch.map((a) => a.id).join(", ");
}

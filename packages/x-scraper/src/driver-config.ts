import chrome from "selenium-webdriver/chrome";

/**
 * Creates Chrome options for the Selenium WebDriver.
 * @returns Configured chrome.Options object.
 */
export const createChromeOptions = (): chrome.Options => {
  const options = new chrome.Options();

  options.addArguments("--headless"); // Keep headless commented out for debugging, enable for production if needed
  options.addArguments("--window-size=1920,3000");
  options.addArguments("--disable-blink-features=AutomationControlled");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--disable-gpu");

  // Fixed User-Agent
  options.addArguments(
    "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  );

  // Automation detection avoidance
  options.addArguments("--disable-infobars");
  options.addArguments("--disable-notifications");
  options.addArguments("--enable-features=NetworkService,NetworkServiceInProcess");
  options.addArguments("--disable-automation");
  options.addArguments("--disable-popup-blocking");

  // Clipboard permissions (essential for the user-data-dir approach to work reliably)
  options.setUserPreferences({
    "profile.default_content_setting_values.clipboard": 1, // 1: Allow
    "profile.content_settings.exceptions.clipboard": {
      "https://x.com,*": {
        last_modified: Date.now(),
        setting: 1, // 1: Allow
      },
      "https://twitter.com,*": {
        last_modified: Date.now(),
        setting: 1, // 1: Allow
      },
    },
  });

  return options;
};

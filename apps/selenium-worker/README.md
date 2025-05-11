# Selenium Worker (@daiko-ai/selenium-worker)

This worker service is responsible for running the X (Twitter) scraper using Selenium to fetch tweets from specified accounts periodically.

## Overview

- Uses `@daiko-ai/x-scraper` package for the core scraping logic.
- Requires Chrome and ChromeDriver to be installed in the execution environment (handled by the `Dockerfile`).
- Designed to be deployed as a separate service (e.g., on Railway) and run as a cron job.
- Fetches account data and saves tweets using database functions (likely defined in `@daiko-ai/shared` or `@daiko-ai/x-scraper`).

## Local Setup & Usage

### 1. Prerequisites

- Node.js (v22+ recommended)
- bun
- Google Chrome installed locally
- ChromeDriver installed locally and available in your `PATH` (matching your Chrome version).

### 2. Installation

From the monorepo root:

```bash
bun install
```

### 3. Environment Variables

Create a `.env` file in the **monorepo root** (or set environment variables directly). The worker (`dotenv` package) will load variables from the root `.env` file.

```.env
# Required
X_USERNAME="your_x_username"
X_PASSWORD="your_x_password"
X_EMAIL="your_x_login_email"
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Optional (but potentially needed by XScraper features)
OPENAI_API_KEY="your_openai_key"

# Other variables used by shared packages or the web app might also be needed here
# ...
```

**Note:** Ensure the `DATABASE_URL` points to your development or production database as needed.

### 4. Running the Worker

From the monorepo root:

```bash
# Run once
bun --filter @daiko-ai/selenium-worker start

# Run in watch mode for development
bun --filter @daiko-ai/selenium-worker dev

# Type check
bun --filter @daiko-ai/selenium-worker typecheck
```

The `start` and `dev` scripts use `tsx` to run the `src/index.ts` file directly.

## Alternative: Running with PM2 (for Cron on Raspberry Pi)

For running this worker as a persistent background service and managing cron-like scheduling, especially on a device like a Raspberry Pi, PM2 is a recommended process manager. This setup assumes you are using `bun` as your package manager and runtime.

### 1. Install PM2

If you haven't already, install PM2 globally. While PM2 is often installed via npm, you can try with bun:

```bash
bun add -g pm2
# If the above doesn't work or isn't standard for PM2, you might need to use npm:
# npm install -g pm2
```

### 2. Create an Ecosystem File

Create an `ecosystem.config.js` file in the `apps/selenium-worker` directory. This file will define how PM2 runs your worker.

```javascript
// apps/selenium-worker/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "selenium-worker",
      script: "./src/index.ts", // Path to your worker's entry point
      interpreter: "bun", // Use bun to run the TypeScript script directly
      cwd: __dirname, // Set current working directory to where ecosystem.config.js is
      cron_restart: "0 */1 * * *", // Example: Run every hour
      env: {
        // Environment variables will be loaded from the .env file in the monorepo root
        // by the application's dotenv setup.
        // You can also define or override them here if needed for PM2.
        // NODE_ENV: 'production',
        // X_USERNAME: 'your_x_username_pm2', // Example override
      },
      autorestart: false, // Important for cron jobs; let cron_restart handle scheduled restarts
      watch: false, // Disable watching for a cron-style job; not needed for scheduled tasks
      max_memory_restart: "300M", // Optional: Restart if it exceeds memory limit (adjust as needed for RPi)
    },
  ],
};
```

**Note:**

- Ensure `script: './src/index.ts'` correctly points to your worker's entry file, relative to `cwd`.
- The application's `dotenv` setup should load variables from the `.env` file in the monorepo root.

### 3. Starting the Worker with PM2

Navigate to the `apps/selenium-worker` directory (or the directory where you placed `ecosystem.config.js`) and run:

```bash
pm2 start ecosystem.config.js
```

### 4. Managing the Worker

- **List processes:** `pm2 list`
- **Show logs:** `pm2 logs selenium-worker` (or `pm2 logs` for all)
- **Stop a process:** `pm2 stop selenium-worker`
- **Restart a process:** `pm2 restart selenium-worker`
- **Delete a process:** `pm2 delete selenium-worker`

### 5. Persisting PM2 on Raspberry Pi Reboots

To ensure PM2 automatically restarts your worker after the Raspberry Pi reboots:

```bash
pm2 save        # Save the current process list managed by PM2
pm2 startup     # Generate and configure a startup script for the current OS
```

Follow the instructions output by the `pm2 startup` command. This will typically provide a command to run with `sudo` to enable the startup script.

### 6. Environment Variables with PM2

As mentioned, your application likely uses `dotenv` to load variables from the monorepo root's `.env` file. PM2 executes your `bun` script, which then loads these variables. If you need to override or set specific variables solely for the PM2 environment, you can do so within the `env` block of the `ecosystem.config.js`.

**Note on Raspberry Pi & Selenium:**
Running Selenium with Chrome/Chromium on a Raspberry Pi can be resource-intensive, especially on older models.

- Ensure your Raspberry Pi has sufficient RAM (e.g., RPi 4 with 2GB+ is recommended).
- Use headless mode for the browser to conserve resources. This is typically configured in your Selenium setup within `@daiko-ai/x-scraper`.
- If you are setting up Chrome/Chromium and ChromeDriver manually on the Raspberry Pi (not using Docker), ensure they are compatible and correctly installed. The `Dockerfile` in this project might offer clues for necessary dependencies.

## Deployment to Railway

This worker is designed to be deployed using the provided `Dockerfile` which handles the installation of Chrome and ChromeDriver.

### 1. Create a New Service on Railway

- Connect your GitHub repository to Railway.
- Create a new project or add a new service to an existing project.
- When adding the service, choose "Deploy from a Dockerfile".

### 2. Configure Service Settings

- **Build Settings:**
  - **Root Directory:** `apps/selenium-worker` (Specify the path to this worker within your monorepo).
  - **Dockerfile Path:** `apps/selenium-worker/Dockerfile` (Should be automatically detected if Root Directory is set).
- **Deploy Settings:**
  - Set up a **Cron Schedule** to run the worker periodically. For example, to run every hour:
    - Schedule: `0 * * * *`
    - Command: (Leave empty to use the Dockerfile `CMD`, which should be updated to use `bun start`)
      _Alternatively, you could explicitly set the command here: `bun --filter @daiko-ai/selenium-worker start`._

### 3. Set Environment Variables

Go to the service's "Variables" tab in Railway and add the required environment variables:

- `X_USERNAME`
- `X_PASSWORD`
- `X_EMAIL`
- `DATABASE_URL` (Use the connection string for your Railway PostgreSQL database or external DB)
- `OPENAI_API_KEY` (If needed)
- Any other variables required by shared packages.

### 4. Deploy

Trigger a deployment manually or let Railway deploy automatically based on your repository commits.

### 5. Monitor

Check the deployment logs in Railway to ensure the Cron Job runs successfully at the scheduled times and that the scraper initializes and executes without errors.

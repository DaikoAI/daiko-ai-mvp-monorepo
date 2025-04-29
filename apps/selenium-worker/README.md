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
- pnpm
- Google Chrome installed locally
- ChromeDriver installed locally and available in your `PATH` (matching your Chrome version).

### 2. Installation

From the monorepo root:

```bash
pnpm install
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
pnpm --filter @daiko-ai/selenium-worker start

# Run in watch mode for development
pnpm --filter @daiko-ai/selenium-worker dev

# Type check
pnpm --filter @daiko-ai/selenium-worker typecheck
```

The `start` and `dev` scripts use `tsx` to run the `src/index.ts` file directly.

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
    - Command: (Leave empty to use the Dockerfile `CMD`, which is `pnpm start`)
      _Alternatively, you could explicitly set the command here: `pnpm --filter @daiko-ai/selenium-worker start`._

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

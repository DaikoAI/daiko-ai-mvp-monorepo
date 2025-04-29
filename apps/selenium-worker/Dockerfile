# 1. Base Image with Node.js, OS deps, Chrome, ChromeDriver
FROM node:22-slim AS base
WORKDIR /app
# Install OS dependencies, Chrome, ChromeDriver (as before)
RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-transport-https ca-certificates curl gnupg wget \
    libglib2.0-0 libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libexpat1 libgbm1 libgcc1 libstdc++6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxshmfence1 libxss1 libxtst6 \
    fonts-liberation libappindicator3-1 xdg-utils lsb-release \
    && rm -rf /var/lib/apt/lists/*
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update && apt-get install -y google-chrome-stable --no-install-recommends && rm -rf /var/lib/apt/lists/*
ARG CHROME_VERSION_FULL=$(google-chrome --version | cut -d ' ' -f 3)
ARG CHROME_VERSION_MAJOR=$(echo $CHROME_VERSION_FULL | cut -d '.' -f 1)
ARG CHROMEDRIVER_VERSION=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/latest-patch-versions-per-build.json | grep -o "\"$CHROME_VERSION_MAJOR\.[^\"]*\"" | head -n 1 | tr -d '"')
RUN echo "Using ChromeDriver version: $CHROMEDRIVER_VERSION based on Chrome $CHROME_VERSION_FULL"
RUN wget -q --continue -P /chromedriver "https://storage.googleapis.com/chrome-for-testing-public/${CHROMEDRIVER_VERSION}/linux64/chromedriver-linux64.zip" \
    && unzip /chromedriver/chromedriver-linux64.zip -d /usr/bin \
    && rm /chromedriver/chromedriver-linux64.zip \
    && chmod +x /usr/bin/chromedriver-linux64/chromedriver \
    && ln -s /usr/bin/chromedriver-linux64/chromedriver /usr/bin/chromedriver
# Install pnpm globally
RUN npm install -g pnpm

# 2. Dependencies Stage - Install ALL dependencies needed for build/typecheck
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/selenium-worker/package.json ./apps/selenium-worker/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/x-scraper/package.json ./packages/x-scraper/package.json
# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# 3. Typecheck Stage - Copy source and run typecheck
FROM deps AS typecheck_stage
WORKDIR /app
COPY . .
# Run typecheck for the worker and its dependencies
RUN pnpm run typecheck --filter @daiko-ai/selenium-worker...

# 4. Production Dependencies Stage - Install only production deps + tsx
FROM base AS prod-deps
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/selenium-worker/package.json ./apps/selenium-worker/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/x-scraper/package.json ./packages/x-scraper/package.json
# Fetch prod dependencies only
RUN pnpm fetch --prod
# Install prod dependencies and tsx
RUN pnpm install --prod --offline --frozen-lockfile
RUN pnpm add tsx # Ensure tsx is available

# 5. Final Production Image
FROM base AS final
WORKDIR /app
# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
# Copy necessary package.json files
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/apps/selenium-worker/package.json ./apps/selenium-worker/package.json
# Copy source code needed for runtime
COPY --from=typecheck_stage /app/apps/selenium-worker/src ./apps/selenium-worker/src
COPY --from=typecheck_stage /app/tsconfig.base.json ./
COPY --from=typecheck_stage /app/apps/selenium-worker/tsconfig.json ./apps/selenium-worker/tsconfig.json
# Copy shared package source if needed by tsx at runtime (check if node_modules linking is sufficient)
COPY --from=typecheck_stage /app/packages/shared/src ./packages/shared/src
COPY --from=typecheck_stage /app/packages/x-scraper/src ./packages/x-scraper/src


# Set path to include chromedriver
ENV PATH="/usr/bin/chromedriver-linux64:${PATH}"
ENV NODE_ENV=production

# Run the worker using tsx via pnpm start script
CMD ["pnpm", "start"]
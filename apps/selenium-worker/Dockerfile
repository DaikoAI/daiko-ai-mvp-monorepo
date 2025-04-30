# Stage 1: Base image with Selenium and basic tools
FROM seleniarm/standalone-chromium:latest AS base

# Install Node.js v22+ and enable corepack for pnpm
USER root
# Install necessary dependencies for NodeSource script
RUN apt-get update && apt-get install -y curl gnupg --no-install-recommends \
    # Add NodeSource repository for Node.js 22.x
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    # Install Node.js
    && apt-get install -y nodejs \
    # Clean up apt cache
    && rm -rf /var/lib/apt/lists/*
# Enable corepack (included with Node.js >= 16.10) to manage pnpm
RUN corepack enable
# Ensure pnpm is available
RUN corepack prepare pnpm@latest --activate

# Stage 2: Builder - Install Turborepo and prune the monorepo
FROM base AS builder
WORKDIR /app
# Define the pnpm global directory
ENV PNPM_HOME="/usr/local/bin/pnpm-global"
ENV PATH="$PNPM_HOME:$PATH"
# Create the directory
RUN mkdir -p $PNPM_HOME
# Install turbo globally using pnpm, specifying the global directory
RUN pnpm add -g turbo@latest --global-dir $PNPM_HOME
# Copy all files for turbo prune
COPY . .
# Prune the monorepo for the target app
RUN turbo prune @daiko-ai/selenium-worker --docker

# Stage 3: Installer - Install dependencies and build the application sequentially
FROM base AS installer
WORKDIR /app
# Copy pruned package manifests and lockfile
COPY --from=builder /app/out/json/ .
# Copy the pruned pnpm-workspace.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./
# Copy the full pruned source code needed for building
COPY --from=builder /app/out/full/ .
# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile
# Build dependencies first (adjust filter based on actual dependencies)
RUN pnpm --filter @daiko-ai/shared run build
RUN pnpm --filter @daiko-ai/x-scraper run build
# Build the target application
RUN pnpm --filter @daiko-ai/selenium-worker run build

# Stage 4: Runner - Copy necessary artifacts for the final image
FROM base AS runner
WORKDIR /app

# Optional: Add a non-root user for security
# RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
# USER appuser

# Copy the entire app structure to maintain workspace references
COPY --from=installer /app .

# Define the command to run the built application directly
CMD ["node", "apps/selenium-worker/dist/index.js"]

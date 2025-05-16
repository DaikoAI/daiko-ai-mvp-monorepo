# Daiko AI MVP Monorepo

## Overview

Daiko AI is an AI-powered trading assistant for cryptocurrency traders. It integrates social media, news, and on-chain data to provide advanced analysis and trading proposals.

## Key Features

- Real-time market data monitoring
- Sentiment analysis from social media (X, Farcaster)
- Information gathering from news sites
- On-chain data analysis
- AI-generated trading proposals
- User portfolio performance tracking

## Technology Stack

- **Frontend**:

  - Next.js 15
  - shadcn/ui
  - Serwist (PWA)

- **Backend**:

  - trpc
  - Route Handler

- **Database**:

  - NeonDB (Postgres)

- **Infrastructure/SaaS**:
  - Vercel
    - Hosting
  - Inngest
    - Job queue

## Project Structure

```zsh
.
├── README.md
├── package.json
├── turbo.json
├── apps
│   ├── lp                   # Landing page
│   ├── selenium-worker      # X scraper job
│   ├── web                  # Main web application (Next.js)
│   │   ├── src
│   │   ├── public
│   │   └── package.json
├── docs                     # Documentation
│   ├── db                   # Database documentation
│   │   ├── schema.dbml      # Database schema
│   │   └── erd.svg          # Database ER diagram
│   └── graph.png            # Agent architecture diagram
│   └── specs                # Contains requirement definitions, etc.
├── packages
│   ├── shared               # Shared code, type definitions, utilities
│   │   ├── src
│   │   └── package.json
│   ├── news-scraper         # News site scraper
│   │   ├── src
│   │   └── package.json
│   ├──
│   ├── signal-detector      # Signal detection engine
│   │   ├── src
│   │   └── package.json
│   └── x-scraper            # X (Twitter) scraper
│       ├── src
│       └── package.json
└── scripts
    └── clean-packages.sh    # Build file cleanup
```

## Architecture

### Overall Architecture

```mermaid
flowchart TB
    %% Batch Jobs Group
    subgraph "Batch Jobs"
        direction TB
        TS["X (Twitter) Scraper<br>(every 15 minutes)"]
        FS["Farcaster Scraper<br>(every 15 minutes)"]
        NS["News Site Scraper<br>(every 30 minutes)"]
        GM["Global Market Data<br>(every 5 minutes)"]
        OS["onchain-subscriber<br>(continuous)"]
        DP["Data Processing Pipeline"]

        TS & FS & NS --> DP
        GM --> DP
        OS --> DP
    end

    %% Firebase Group
    subgraph "Firebase"
        direction TB
        TP["Token Prices<br>(token_prices)"]
        SPT["Social Posts<br>(social_posts)"]
        NAT["News Articles<br>(news_articles)"]
        UPP["User Portfolio Performance<br>(user_portfolio_performance)"]
        UP["User Profiles<br>(users)"]
        WA["Watched Accounts<br>(user_watched_accounts)"]
        TK["Token Info<br>(tokens)"]
        TPR["Trade Proposals<br>(trade_proposals)"]
    end

    %% Server Group
    subgraph "Server"
        direction TB

        %% Trigger & Scheduler Subgroup
        subgraph "Trigger & Scheduler"
            TDE["Trigger Detection Engine"]
            SCH["Scheduler"]
            TDE --> TSQ["Trigger Queue"]
            SCH --> SPQ["Schedule Queue"]
        end

        %% Langgraph Subgroup with Two Phases
        subgraph "Langgraph"
            direction TB
            %% Data Fetch Phase
            subgraph "Data Fetch Phase"
                DFM["Data Fetch Module"]
            end
            %% Proposal Generation Phase
            subgraph "Proposal Generation Phase"
                CCDM["Crypto Domain Model"]
                PGM["Proposal Generation Module"]
            end
            %% Connect Data Fetch to Proposal Generation
            DFM --> CCDM
            CCDM --> PGM
        end

        %% Notification & API Subgroup
        subgraph "Notification & API"
            PG["Proposal Generation Process"]
            PDB["Proposal Database"]
            WPS["Web Push Service"]
            API["REST/GraphQL API"]

            PGM --> PG
            PG --> PDB
            PDB --> WPS
            PDB --> API
        end

        %% Connecting Trigger & Scheduler to Langgraph
        TSQ & SPQ --> DFM
    end

    %% Frontend Group
    subgraph "Frontend (Next.js)"
        API --> FE["Next.js Application"]
        WPS --> PN["Push Notification Receiver"]
        PN --> FE
        FE --> WC["Wallet Connection"]
        FE --> PD["Proposal Dashboard"]
        FE --> PFB["User Feedback"]
        PFB --> PG
    end

    %% Data Flow Between Major Components
    DP --> TP & SPT & NAT & UP & WA & TK
    OS --> TK
    %% Langgraph Data Fetch receives latest onchain and Firebase data:
    OS ---|Latest Onchain Portfolio| DFM
    UP ---|User Portfolio Data| DFM
    TP & SPT & NAT & UPP & WA ---|Additional Firebase Data| DFM

    %% Existing Flow for Trade Proposals
    PG --> TPR

    %% Styling Definitions
    classDef batchNode fill:#8E44AD,stroke:#2C3E50,stroke-width:2px,color:white;
    classDef dataNode fill:#3498DB,stroke:#2C3E50,stroke-width:2px,color:white;
    classDef serverNode fill:#1ABC9C,stroke:#2C3E50,stroke-width:2px,color:white;
    classDef frontendNode fill:#F39C12,stroke:#2C3E50,stroke-width:2px,color:white;

    %% Component Color Coding
    class TS,FS,NS,GM,OS,DP batchNode
    class TP,SPT,NAT,UPP,UP,WA,TK,TPR dataNode
    class TDE,SCH,TSQ,SPQ,DFM,CCDM,PGM,PG,PDB,WPS,API serverNode
    class FE,PN,WC,PD,PFB frontendNode
```

### Agent Architecture

![Agent Architecture](./docs/graph.png)

## Setup Instructions

### Prerequisites

- Node.js 20 or higher
- Bun 1.2.13 or higher
- NeonDB

### Development Environment Setup

1. Clone the repository

```bash
git clone https://github.com/your-org/daiko-ai-mvp-monorepo.git
cd daiko-ai-mvp-monorepo
```

2. Install dependencies

```bash
bun install
```

3. Configure environment variables

```bash
# For the web app
cp apps/web/.env.example apps/web/.env
# Set the necessary environment variables

# For the scrapers
cp packages/news-scraper/.env.example packages/news-scraper/.env
# Set the necessary environment variables
```

4. Start the development servers

```bash
# Frontend
bun dev:web

# X (Twitter) Scraper
bun dev:x-scraper

# News Scraper
bun dev:news-scraper
```

## Database Operations (Drizzle ORM + Neon Postgres)

This project uses [Drizzle ORM](https://orm.drizzle.team) and [Neon Postgres](https://neon.tech) for database access. The database schema and common queries are centrally managed in the `packages/shared` package.

### Setup

1. Create a `.env` file and set the Neon database connection information:

```
DATABASE_URL=postgres://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/neondb
```

2. Install the required packages:

```bash
bun add -F @daiko-ai/shared @neondatabase/serverless dotenv drizzle-orm
bun add -D drizzle-kit
```

### Schema Definition

The schema is defined in the `packages/shared/src/db/schema` directory. If you add a new table, create a new file in this directory and export it from `index.ts`.

```typescript
// packages/shared/src/db/schema/example.ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const exampleTable = pgTable("example_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Example = typeof exampleTable.$inferSelect;
export type NewExample = typeof exampleTable.$inferInsert;
```

### Migrations

#### Generating Migration Files

After making schema changes, generate migration files with the following command:

```bash
bun run -F @daiko-ai/shared db:generate
```

The generated migration files are saved in the `migrations` directory.

#### Applying to the Database

To apply migrations to the database, execute the following command:

```bash
# Update DB using migration files
bun run -F @daiko-ai/shared migrate

# Or directly apply schema (Recommended for development only)
bun run -F @daiko-ai/shared db:push
```

### Database Operations

#### Connection

Import the database connection from `packages/shared/src/db/connection.ts` to use it:

```typescript
import { db } from "@daiko-ai/shared/src/db/connection";
```

#### Common Queries

Common query functions are defined in `packages/shared/src/db/queries`.

```typescript
import { getUserById, createUser } from "@daiko-ai/shared/src/db/queries/users";

// Get user
const user = await getUserById(1);

// Create user
await createUser({
  name: "Username",
  age: 30,
  email: "user@example.com",
});
```

#### Custom Queries

Define package-specific query logic within each package:

```typescript
import { db } from "@daiko-ai/shared/src/db/connection";
import { eq } from "drizzle-orm";
import { usersTable } from "@daiko-ai/shared/src/db/schema/users";

// Custom query
export async function findUsersByAge(age: number) {
  return db.select().from(usersTable).where(eq(usersTable.age, age));
}
```

### Development Tools

You can visually interact with the database using Drizzle Studio:

```bash
bun run -F @daiko-ai/shared db:studio
```

Open `http://localhost:4983` in your browser to view and edit tables and data.

### Recommended Practices

1.  **Schema Design**: Manage the common schema for the entire application in the `shared` package.
2.  **Query Separation**: Place common queries in the `shared` package and package-specific queries in their respective packages.
3.  **Migration Management**: Always perform schema changes through migrations.
4.  **Type Safety**: Consistently utilize Drizzle's type definitions (`$inferSelect`, `$inferInsert`).

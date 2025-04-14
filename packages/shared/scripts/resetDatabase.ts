import * as dotenv from "dotenv";
import { sql, SQL } from "drizzle-orm";
import * as path from "path"; // Import path
import { db } from "../src/db/connection";

// Use path.resolve to ensure correct path regardless of execution context
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MIGRATION_TABLE = "__drizzle_migrations";

async function truncateAllTables() {
  const nodeEnv = process.env.NODE_ENV;
  console.log(`ℹ️ Current NODE_ENV: ${nodeEnv}`);
  if (nodeEnv === "production" || nodeEnv === "staging") {
    console.error("❌ DANGER: Cannot truncate tables in 'production' or 'staging' environment.");
    console.error("❌ Aborting operation.");
    process.exit(1);
  }

  try {
    console.log("⏳ Analyzing database schema from db instance...");
    const tableSchema = db._.schema;
    if (!tableSchema) {
      throw new Error("❌ No table schema found on the db instance.");
    }

    console.log("🗑️ Preparing to truncate all tables based on schema...");

    const queries: SQL[] = [];
    const tableNamesFound: string[] = [];

    for (const key in tableSchema) {
      const table = tableSchema[key];

      console.log(`   🧨 Preparing truncate query for: ${table.dbName}`);
      tableNamesFound.push(table.dbName);
      queries.push(sql.raw(`TRUNCATE TABLE ${table.dbName} RESTART IDENTITY CASCADE;`));
    }

    if (queries.length === 0) {
      console.log("✅ No tables found in schema to truncate (excluding migration table).");
      return;
    }

    console.log(`ℹ️ Tables to truncate: ${tableNamesFound.join(", ")}`);
    console.log("⏳ Executing truncate queries sequentially (no transaction support in neon-http)...");

    // Execute queries sequentially without a transaction block
    console.log(`   Executing ${queries.length} truncate commands...`);
    for (const query of queries) {
      if (query) {
        // console.log(`      Running: ${query.toSQL().sql}`);
        await db.execute(query);
      }
    }

    console.log("✅ All specified tables truncated successfully.");
  } catch (error) {
    console.error("❌ An error occurred during table truncation:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    console.log("🏁 Truncate script finished.");
    process.exit(0);
  }
}

truncateAllTables();

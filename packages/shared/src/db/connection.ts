import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import { types } from "pg"; // Import types from pg
import ws from "ws";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("connection.ts: DATABASE_URL is not set");
}

// Configure WebSocket for Node.js if necessary (e.g., for local development)
// Check if not in Edge Runtime and WebSocket is not globally available
// VercelのEdge Runtimeでは `process.env.NEXT_RUNTIME === 'edge'` で判定できる場合がある
if (
  typeof process !== "undefined" &&
  process.env &&
  process.env.NEXT_RUNTIME !== "edge" &&
  typeof WebSocket === "undefined"
) {
  neonConfig.webSocketConstructor = ws;
}

// Set type parsers for pg driver to handle potential parsing issues, especially with dates/timestamps
types.setTypeParser(types.builtins.TIMESTAMP, (val: string) => val); // OID 1114
types.setTypeParser(types.builtins.TIMESTAMPTZ, (val: string) => val); // OID 1184
// You might need to add parsers for other types if issues persist, e.g.:
// types.setTypeParser(types.builtins.DATE, (val: string) => val); // OID 1082
// types.setTypeParser(types.builtins.NUMERIC, (val: string) => val); // OID 1700 - to parse as string, then handle with BigNumber.js if needed
// types.setTypeParser(types.builtins.INT8, (val: string) => val); // OID 20 - for big integers, parse as string

// Create a new Pool instance.
// This pool can be used to create Drizzle instances.
// For serverless environments, managing the lifecycle (connect/end) of this pool
// per request might be necessary, typically within the TRPC context creation.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (err: Error) => console.error("Neon Pool Error:", err));

// Default database instance using the pool.
// Note: In serverless environments, you might want to create this per request.
export const db = drizzle(pool, { schema }); // Removed logger: true

export type NodePostgresDatabase = typeof db;

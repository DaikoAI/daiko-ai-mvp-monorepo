import { sql } from "drizzle-orm";
import { pgMaterializedView, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { tokenPriceHistory } from "./token_price_history";

// Each token's closest price record to 24 hours ago
export const tokenPrice24hAgoView = pgMaterializedView("token_price_24h_ago_view", {
  tokenAddress: varchar("token_address", { length: 255 }).notNull().primaryKey(),
  priceUsd: text("price_usd").notNull(),
  timestamp: timestamp("timestamp").notNull(),
}).as(sql`
  WITH ranked_prices AS (
    SELECT
      h.token_address,
      h.price_usd,
      h.timestamp,
      ROW_NUMBER() OVER (
        PARTITION BY h.token_address
        ORDER BY ABS(EXTRACT(EPOCH FROM (NOW() - INTERVAL '24 hours')) - EXTRACT(EPOCH FROM h.timestamp)) ASC
      ) AS rn
    FROM
      ${tokenPriceHistory} h
    WHERE
      h.timestamp <= NOW() - INTERVAL '23 hours'
      AND h.timestamp >= NOW() - INTERVAL '25 hours'
  )
  SELECT
    rp.token_address,
    rp.price_usd,
    rp.timestamp
  FROM
    ranked_prices rp
  WHERE
    rp.rn = 1
`);

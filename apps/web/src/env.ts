import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    HELIUS_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    FIRECRAWL_API_KEY: z.string(),
    DATABASE_URL: z.string(),
    AUTH_SECRET: z.string(),
    NODE_ENV: z.enum(["development", "production"]),
    AUTH_GOOGLE_ID: z.string(),
    AUTH_GOOGLE_SECRET: z.string(),
    // AUTH_TWITTER_ID: z.string(),
    // AUTH_TWITTER_SECRET: z.string(),
    WEB_PUSH_VAPID_PRIVATE_KEY: z.string(),
    CRON_SECRET: z.string(),
    INNGEST_EVENT_KEY: z.string(),
    INNGEST_SIGNING_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_DEBUG: z.string().transform((s) => s !== "false" && s !== "0"),
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: z.string(),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    // AUTH_TWITTER_ID: process.env.AUTH_TWITTER_ID,
    // AUTH_TWITTER_SECRET: process.env.AUTH_TWITTER_SECRET,
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
    WEB_PUSH_VAPID_PRIVATE_KEY: process.env.WEB_PUSH_VAPID_PRIVATE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  // experimental__runtimeEnv: {
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // }
});

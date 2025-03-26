import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    HELIUS_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    FIRECRAWL_API_KEY: z.string(),
    FIREBASE_PROJECT_ID: z.string(),
    FIREBASE_PRIVATE_KEY: z.string(),
    FIREBASE_CLIENT_EMAIL: z.string(),
    FIREBASE_DATABASE_URL: z.string(),
    CRON_SECRET: z.string(),
  },
  client: {
    NEXT_PUBLIC_DEBUG: z.string().transform((s) => s !== "false" && s !== "0"),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
    CRON_SECRET: process.env.CRON_SECRET,
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  // experimental__runtimeEnv: {
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // }
});

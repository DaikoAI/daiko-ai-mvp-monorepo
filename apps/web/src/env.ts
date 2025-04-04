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
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  // experimental__runtimeEnv: {
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // }
});

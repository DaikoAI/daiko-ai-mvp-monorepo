ALTER TABLE "x_accounts" ADD COLUMN "last_tweet_updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "x_accounts" DROP COLUMN "last_tweet_id";
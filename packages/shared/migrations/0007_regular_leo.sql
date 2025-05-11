ALTER TABLE "tweets" ADD COLUMN "retweet_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "reply_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "like_count" integer DEFAULT 0 NOT NULL;
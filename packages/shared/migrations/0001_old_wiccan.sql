CREATE TABLE "farcaster_casts" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"author_fid" integer NOT NULL,
	"text" text NOT NULL,
	"reply_to" text,
	"timestamp" timestamp NOT NULL,
	"fetched_at" timestamp NOT NULL,
	"is_latest" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "farcaster_casts_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "farcaster_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"last_scanned_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "farcaster_keywords_keyword_unique" UNIQUE("keyword")
);
--> statement-breakpoint
CREATE TABLE "farcaster_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"fid" integer NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"bio" text,
	"followers_count" integer DEFAULT 0,
	"following_count" integer DEFAULT 0,
	"last_fetched_at" timestamp,
	"is_monitored" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "farcaster_users_fid_unique" UNIQUE("fid")
);
--> statement-breakpoint
DROP INDEX "endpoint_unique_idx";--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_endpoint_pk" PRIMARY KEY("user_id","endpoint");--> statement-breakpoint
CREATE UNIQUE INDEX "farcaster_casts_hash_idx" ON "farcaster_casts" USING btree ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX "farcaster_casts_author_fid_idx" ON "farcaster_casts" USING btree ("author_fid");--> statement-breakpoint
CREATE UNIQUE INDEX "farcaster_users_fid_idx" ON "farcaster_users" USING btree ("fid");--> statement-breakpoint
CREATE UNIQUE INDEX "farcaster_users_username_idx" ON "farcaster_users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "user_os_browser_unique_idx" ON "push_subscriptions" USING btree ("user_id","os","browser");
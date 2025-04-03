CREATE TABLE "news_sites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"content" text,
	"user_ids" json DEFAULT '[]',
	"last_scraped" timestamp,
	"created_at" timestamp DEFAULT NOW() NOT NULL,
	"updated_at" timestamp DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger_event_id" varchar,
	"user_id" varchar,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"reason" json NOT NULL,
	"sources" json NOT NULL,
	"type" varchar,
	"proposed_by" varchar,
	"financial_impact" json,
	"expires_at" timestamp NOT NULL,
	"status" varchar DEFAULT 'active',
	"contract_call" json,
	"created_at" timestamp DEFAULT NOW() NOT NULL,
	"updated_at" timestamp DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tweets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"x_account_id" varchar NOT NULL,
	"content" text NOT NULL,
	"tweet_time" timestamp NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT NOW() NOT NULL,
	"updated_at" timestamp DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_table" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "users_table_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "x_accounts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"display_name" text,
	"profile_image_url" text,
	"last_tweet_id" varchar,
	"user_ids" json,
	"created_at" timestamp DEFAULT NOW() NOT NULL,
	"updated_at" timestamp DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_x_account_id_x_accounts_id_fk" FOREIGN KEY ("x_account_id") REFERENCES "public"."x_accounts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tweets" DROP CONSTRAINT "tweets_x_account_id_x_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "author_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_author_id_x_accounts_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."x_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tweets" DROP COLUMN "x_account_id";
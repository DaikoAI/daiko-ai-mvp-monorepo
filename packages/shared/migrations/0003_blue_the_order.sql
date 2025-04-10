CREATE TABLE "token_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"price_usd" varchar(78) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"source" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "token_price_history" ADD CONSTRAINT "token_price_history_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;
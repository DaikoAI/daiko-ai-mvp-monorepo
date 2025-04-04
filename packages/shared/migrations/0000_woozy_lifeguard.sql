CREATE TABLE "accounts" (
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "funding_rates" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"rate" double precision NOT NULL,
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "interest_rates" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"interest_rate" double precision NOT NULL,
	"effective_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"principal" text NOT NULL,
	"accrued_interest" text NOT NULL,
	"start_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"last_update" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"interest_rate" double precision NOT NULL,
	"status" varchar(20) NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "perp_positions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"position_direction" varchar(10) NOT NULL,
	"leverage" integer NOT NULL,
	"entry_price" text NOT NULL,
	"position_size" text NOT NULL,
	"collateral_amount" text NOT NULL,
	"liquidation_price" text NOT NULL,
	"entry_funding_rate" double precision NOT NULL,
	"accumulated_funding" text NOT NULL,
	"funding_rate_last_applied" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"status" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
CREATE TABLE "sessions" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"address" varchar(255) NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"decimals" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"icon_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"from_token_address" varchar(255),
	"to_token_address" varchar(255),
	"amount_from" text,
	"amount_to" text,
	"fee" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
CREATE TABLE "user_balances" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"balance" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"age" integer NOT NULL,
	"image" varchar(255),
	"tradeStyle" text NOT NULL,
	"totalAssetUsd" integer NOT NULL,
	"cryptoInvestmentUsd" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
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
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_rates" ADD CONSTRAINT "funding_rates_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_rates" ADD CONSTRAINT "interest_rates_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perp_positions" ADD CONSTRAINT "perp_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perp_positions" ADD CONSTRAINT "perp_positions_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_token_address_tokens_address_fk" FOREIGN KEY ("from_token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_token_address_tokens_address_fk" FOREIGN KEY ("to_token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_x_account_id_x_accounts_id_fk" FOREIGN KEY ("x_account_id") REFERENCES "public"."x_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");
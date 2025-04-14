CREATE TYPE "public"."role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
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
CREATE TABLE "authenticators" (
	"credential_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"credential_public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"credential_device_type" varchar(255) NOT NULL,
	"credential_backed_up" integer NOT NULL,
	"transports" varchar(255),
	CONSTRAINT "authenticators_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id"),
	CONSTRAINT "authenticators_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"thread_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"parts" json NOT NULL,
	"attachments" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text DEFAULT 'New Chat' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "portfolio_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"total_value_usd" numeric(20, 8) NOT NULL,
	"pnl_from_previous" numeric(20, 8),
	"pnl_from_start" numeric(20, 8),
	"snapshot_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "push_subscriptions" (
	"user_id" varchar(255) NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"os" varchar(100),
	"browser" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"price_usd" varchar(78) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"source" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_prices" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"price_usd" text NOT NULL,
	"last_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"source" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"address" varchar(255) PRIMARY KEY NOT NULL,
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
	"balance" numeric(100, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"age" integer,
	"image" varchar(255),
	"trade_style" text,
	"total_asset_usd" integer,
	"crypto_investment_usd" integer,
	"wallet_address" varchar(255) DEFAULT '1nc1nerator11111111111111111111111111111111' NOT NULL,
	"risk_tolerance" varchar(20) DEFAULT 'medium',
	"notification_enabled" boolean DEFAULT false
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
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_rates" ADD CONSTRAINT "funding_rates_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_rates" ADD CONSTRAINT "interest_rates_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perp_positions" ADD CONSTRAINT "perp_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perp_positions" ADD CONSTRAINT "perp_positions_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_price_history" ADD CONSTRAINT "token_price_history_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_prices" ADD CONSTRAINT "token_prices_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_token_address_tokens_address_fk" FOREIGN KEY ("from_token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_token_address_tokens_address_fk" FOREIGN KEY ("to_token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_x_account_id_x_accounts_id_fk" FOREIGN KEY ("x_account_id") REFERENCES "public"."x_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "authenticator_user_id_idx" ON "authenticators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_thread" ON "chat_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "idx_chat_threads_user" ON "chat_threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chat_threads_created" ON "chat_threads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_funding_rates_token" ON "funding_rates" USING btree ("token_address");--> statement-breakpoint
CREATE INDEX "idx_funding_rates_timestamp" ON "funding_rates" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_interest_rates_token" ON "interest_rates" USING btree ("token_address","action_type");--> statement-breakpoint
CREATE INDEX "idx_interest_rates_effective" ON "interest_rates" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "idx_investments_user_id" ON "investments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_investments_token_address" ON "investments" USING btree ("token_address");--> statement-breakpoint
CREATE INDEX "idx_investments_status" ON "investments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_investments_action_type" ON "investments" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_perp_user_status" ON "perp_positions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_perp_token_address" ON "perp_positions" USING btree ("token_address");--> statement-breakpoint
CREATE INDEX "idx_perp_liquidation" ON "perp_positions" USING btree ("liquidation_price","status");--> statement-breakpoint
CREATE INDEX "user_timestamp_idx" ON "portfolio_snapshots" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "timestamp_idx" ON "portfolio_snapshots" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "endpoint_unique_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscription_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_token_prices_address" ON "token_prices" USING btree ("token_address");--> statement-breakpoint
CREATE INDEX "idx_token_prices_updated" ON "token_prices" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "idx_tokens_symbol" ON "tokens" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_tokens_type" ON "tokens" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_transactions_user_id" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_created_at" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_type_user" ON "transactions" USING btree ("transaction_type","user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_from_token" ON "transactions" USING btree ("from_token_address");--> statement-breakpoint
CREATE INDEX "idx_transactions_to_token" ON "transactions" USING btree ("to_token_address");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_balances_user_token" ON "user_balances" USING btree ("user_id","token_address");--> statement-breakpoint
CREATE INDEX "idx_user_balances_token_address" ON "user_balances" USING btree ("token_address");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_wallet_address" ON "users" USING btree ("wallet_address");
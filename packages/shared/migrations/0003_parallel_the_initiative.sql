CREATE TABLE "portfolio_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"total_value_usd" numeric(20, 8) NOT NULL,
	"pnl_from_previous" numeric(20, 8),
	"pnl_from_start" numeric(20, 8),
	"snapshot_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
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
DROP INDEX "sessions_user_id_idx";--> statement-breakpoint
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_prices" ADD CONSTRAINT "token_prices_token_address_tokens_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."tokens"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_timestamp_idx" ON "portfolio_snapshots" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "timestamp_idx" ON "portfolio_snapshots" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_token_prices_address" ON "token_prices" USING btree ("token_address");--> statement-breakpoint
CREATE INDEX "idx_token_prices_updated" ON "token_prices" USING btree ("last_updated");--> statement-breakpoint
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
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
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
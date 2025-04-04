ALTER TABLE "users" RENAME COLUMN "emailVerified" TO "email_verified";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "tradeStyle" TO "trade_style";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "totalAssetUsd" TO "total_asset_usd";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "cryptoInvestmentUsd" TO "crypto_investment_usd";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_address" varchar(255) NOT NULL;
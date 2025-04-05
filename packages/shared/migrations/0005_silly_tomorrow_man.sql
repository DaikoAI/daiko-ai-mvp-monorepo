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
ALTER TABLE "users" ALTER COLUMN "age" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "trade_style" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "total_asset_usd" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "crypto_investment_usd" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "wallet_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "authenticator_user_id_idx" ON "authenticators" USING btree ("user_id");
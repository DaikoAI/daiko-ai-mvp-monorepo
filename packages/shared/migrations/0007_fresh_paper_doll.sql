ALTER TABLE "users" ADD COLUMN "risk_tolerance" varchar(20) DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "staking_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birthday" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "twitter_connected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "twitter_username" varchar(255);
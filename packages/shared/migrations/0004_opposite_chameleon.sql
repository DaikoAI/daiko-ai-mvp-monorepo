ALTER TABLE "users" ADD COLUMN "notification_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "staking_enabled";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "birthday";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "twitter_connected";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "twitter_username";
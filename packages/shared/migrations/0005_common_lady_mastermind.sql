CREATE TYPE "public"."sentiment_type" AS ENUM('positive', 'negative', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."suggestion_type" AS ENUM('buy', 'sell', 'hold', 'stake', 'close_position');--> statement-breakpoint
ALTER TABLE "signals" ALTER COLUMN "sources" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "signals" ALTER COLUMN "suggestion_type" SET DATA TYPE suggestion_type;--> statement-breakpoint
ALTER TABLE "signals" ADD COLUMN "sentiment_type" "sentiment_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "signals" DROP COLUMN "sentiment_score";--> statement-breakpoint
ALTER TABLE "signals" DROP COLUMN "strength";--> statement-breakpoint
ALTER TABLE "signals" DROP COLUMN "metadata";--> statement-breakpoint
DROP TYPE "public"."suggestion_type_enum";
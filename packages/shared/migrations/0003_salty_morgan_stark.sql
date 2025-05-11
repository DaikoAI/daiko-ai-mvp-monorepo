CREATE TYPE "public"."suggestion_type_enum" AS ENUM('buy', 'sell', 'close_position', 'stake', 'technical_analysis', 'fundamentals', 'news', 'other');--> statement-breakpoint
CREATE TABLE "signals" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"token_address" varchar(255) NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"sources" json NOT NULL,
	"sentiment_score" real NOT NULL,
	"suggestion_type" "suggestion_type_enum" NOT NULL,
	"strength" integer NOT NULL,
	"confidence" real NOT NULL,
	"rationale_summary" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"metadata" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

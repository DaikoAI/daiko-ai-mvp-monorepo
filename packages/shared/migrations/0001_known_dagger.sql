ALTER TYPE "public"."sender" RENAME TO "role";--> statement-breakpoint
ALTER TABLE "chat_messages" RENAME COLUMN "sender" TO "role";--> statement-breakpoint
ALTER TABLE "public"."chat_messages" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
ALTER TABLE "public"."chat_messages" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";
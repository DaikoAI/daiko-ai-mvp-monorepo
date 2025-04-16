CREATE TABLE "cast_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"cast_id" integer NOT NULL,
	"keyword_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cast_keywords" ADD CONSTRAINT "cast_keywords_cast_id_farcaster_casts_id_fk" FOREIGN KEY ("cast_id") REFERENCES "public"."farcaster_casts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cast_keywords" ADD CONSTRAINT "cast_keywords_keyword_id_farcaster_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."farcaster_keywords"("id") ON DELETE no action ON UPDATE no action;
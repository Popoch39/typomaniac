CREATE TABLE "ranked_rating" (
	"user_id" text PRIMARY KEY NOT NULL,
	"mmr" integer NOT NULL,
	"placements_played" integer NOT NULL,
	"tier" text,
	"division" integer,
	"tp" integer NOT NULL,
	"shielded" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "duel" ADD COLUMN "ranked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "duel_player" ADD COLUMN "tp_delta" integer;--> statement-breakpoint
ALTER TABLE "duel_player" ADD COLUMN "mmr_delta" integer;--> statement-breakpoint
ALTER TABLE "ranked_rating" ADD CONSTRAINT "ranked_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE TABLE "duel" (
	"id" text PRIMARY KEY NOT NULL,
	"seed" bigint NOT NULL,
	"language" text NOT NULL,
	"word_list_version" integer NOT NULL,
	"mode" text NOT NULL,
	"seconds" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp NOT NULL,
	"outcome" text NOT NULL,
	"winner_id" text
);
--> statement-breakpoint
CREATE TABLE "duel_player" (
	"duel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"wpm" double precision NOT NULL,
	"raw" double precision NOT NULL,
	"accuracy" double precision NOT NULL,
	"consistency" double precision NOT NULL,
	"correct_chars" integer NOT NULL,
	"incorrect_chars" integer NOT NULL,
	"extra_chars" integer NOT NULL,
	"missed_chars" integer NOT NULL,
	"keystrokes" jsonb NOT NULL,
	CONSTRAINT "duel_player_duel_id_user_id_pk" PRIMARY KEY("duel_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "duel" ADD CONSTRAINT "duel_winner_id_user_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_player" ADD CONSTRAINT "duel_player_duel_id_duel_id_fk" FOREIGN KEY ("duel_id") REFERENCES "public"."duel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_player" ADD CONSTRAINT "duel_player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "duel_player_userId_idx" ON "duel_player" USING btree ("user_id");
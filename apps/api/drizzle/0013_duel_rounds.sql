CREATE TABLE "duel_round" (
	"duel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"round_index" integer NOT NULL,
	"seed" bigint NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp NOT NULL,
	"wpm" double precision NOT NULL,
	"raw" double precision NOT NULL,
	"accuracy" double precision NOT NULL,
	"consistency" double precision NOT NULL,
	"correct_chars" integer NOT NULL,
	"incorrect_chars" integer NOT NULL,
	"extra_chars" integer NOT NULL,
	"missed_chars" integer NOT NULL,
	"score" integer,
	"best_combo" integer,
	"bursts" integer,
	"keystrokes" jsonb NOT NULL,
	CONSTRAINT "duel_round_duel_id_user_id_round_index_pk" PRIMARY KEY("duel_id","user_id","round_index")
);
--> statement-breakpoint
ALTER TABLE "duel" ADD COLUMN "rounds_to_win" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "duel_player" ADD COLUMN "rounds_won" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "duel_round" ADD CONSTRAINT "duel_round_duel_id_duel_id_fk" FOREIGN KEY ("duel_id") REFERENCES "public"."duel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_round" ADD CONSTRAINT "duel_round_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "duel_round_user_id_idx" ON "duel_round" USING btree ("user_id");
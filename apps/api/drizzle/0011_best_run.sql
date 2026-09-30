CREATE TABLE "best_run" (
	"user_id" text NOT NULL,
	"mode" text NOT NULL,
	"length" integer NOT NULL,
	"language" text NOT NULL,
	"seed" bigint NOT NULL,
	"word_list_version" integer NOT NULL,
	"keystrokes" jsonb NOT NULL,
	"wpm" double precision NOT NULL,
	"raw" double precision NOT NULL,
	"accuracy" double precision NOT NULL,
	"consistency" double precision NOT NULL,
	"correct_chars" integer NOT NULL,
	"incorrect_chars" integer NOT NULL,
	"extra_chars" integer NOT NULL,
	"missed_chars" integer NOT NULL,
	"sent_at" timestamp NOT NULL,
	CONSTRAINT "best_run_user_id_mode_length_language_pk" PRIMARY KEY("user_id","mode","length","language")
);
--> statement-breakpoint
ALTER TABLE "best_run" ADD CONSTRAINT "best_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
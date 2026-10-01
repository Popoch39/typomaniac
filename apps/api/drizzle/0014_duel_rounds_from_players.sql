-- Every Duel written so far was one Round: its Seed and its time, each player's Result, Score and
-- Keystrokes.
INSERT INTO "duel_round" (
	"duel_id", "user_id", "round_index", "seed", "started_at", "ended_at",
	"wpm", "raw", "accuracy", "consistency",
	"correct_chars", "incorrect_chars", "extra_chars", "missed_chars",
	"score", "best_combo", "bursts", "keystrokes"
)
SELECT
	p."duel_id", p."user_id", 0, d."seed", d."started_at", d."ended_at",
	p."wpm", p."raw", p."accuracy", p."consistency",
	p."correct_chars", p."incorrect_chars", p."extra_chars", p."missed_chars",
	p."score", p."best_combo", p."bursts", p."keystrokes"
FROM "duel_player" p
JOIN "duel" d ON d."id" = p."duel_id";
--> statement-breakpoint
-- The winner by Score won that Round; a Draw or a Forfeit leaves it to nobody.
UPDATE "duel_player" p
SET "rounds_won" = 1
FROM "duel" d
WHERE d."id" = p."duel_id" AND d."outcome" = 'win' AND d."winner_id" = p."user_id";

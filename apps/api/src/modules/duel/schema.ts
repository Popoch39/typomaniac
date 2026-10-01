import { ORNAMENT_CHOICES, PLACEMENT_DUELS, TIERS } from "ranked";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Keystroke } from "typing-engine";

import { user } from "../../database/auth-schema";
import { DUEL_OUTCOMES } from "./store";

// A finished Duel: what its Rounds are played in (Language, Word list version, Mode) and its
// outcome; each Round has its own Text (`duel_round`). A Duel still running when the API stops is
// never written (ADR 0003).
export const duel = pgTable(
  "duel",
  {
    id: text("id").primaryKey(),
    language: text("language", { enum: ["fr", "en"] }).notNull(),
    wordListVersion: integer("word_list_version").notNull(),
    mode: text("mode", { enum: ["time"] }).notNull(),
    // The time of each Round.
    seconds: integer("seconds").notNull(),
    // The end of the Countdown: the start of the first Round.
    startedAt: timestamp("started_at").notNull(),
    // The end of its time, or the moment of the Forfeit.
    endedAt: timestamp("ended_at").notNull(),
    outcome: text("outcome", { enum: DUEL_OUTCOMES }).notNull(),
    // Null for a Draw, or once the winner's User is deleted.
    winnerId: text("winner_id").references(() => user.id, { onDelete: "set null" }),
    // A Duel of the Queue, which moved both Ratings; false for a Challenge and for the Duels played
    // before ranked existed.
    ranked: boolean("ranked").notNull().default(false),
    // How many Rounds a player had to win to win the Duel: 1 for the Duels of a single Round.
    roundsToWin: integer("rounds_to_win").notNull().default(1),
  },
  // The Duels by their end, the most recent read first: Jouer's last Duels of a Tier walk it.
  (table) => [index("duel_ended_at_idx").on(table.endedAt, table.id)],
);

// `stepOf` of the ranked package in SQL: 4 steps per Tier, the Division within it, Maniac last.
// Null in Placement.
const tierList = TIERS.map((tier) => `'${tier}'`).join(", ");

const ladderStep = sql.raw(
  `(array_position(array[${tierList}]::text[], tier) - 1) * 4 + coalesce(4 - division, 0)`,
);

// Past Placement, written as a literal: the Leaderboard's index only serves the queries whose
// filter is this very one, never a parameter.
export const pastPlacementSql = sql.raw(`placements_played >= ${PLACEMENT_DUELS}`);

// A User's Rating (ranked package): the hidden MMR and the visible rank. Created on their first
// join of the Queue, from their Pace; moved by each ranked Duel, written with it.
export const rankedRating = pgTable(
  "ranked_rating",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    mmr: integer("mmr").notNull(),
    // Below PLACEMENT_DUELS, the User is in Placement: no Tier yet.
    placementsPlayed: integer("placements_played").notNull(),
    // Null in Placement.
    tier: text("tier", { enum: TIERS }),
    // Null in Placement and in Maniac.
    division: integer("division"),
    tp: integer("tp").notNull(),
    // Just moved up: the next loss below 0 TP keeps the Division.
    shielded: boolean("shielded").notNull(),
    // The Ornament the User chose to wear (`OrnamentChoice`), resolved by `ornamentOf`: never sent
    // as is for another User.
    ornament: text("ornament", { enum: ORNAMENT_CHOICES }).notNull().default("follow"),
    // Where the rank stands, Tier and Division as one number: what the Leaderboard sorts on first.
    ladderStep: integer("ladder_step").generatedAlwaysAs(ladderStep),
  },
  // The Leaderboard's order, the Users past Placement only: its pages, their Places and its size
  // are all read on it (ADR 0015), backwards for the best first.
  (table) => [
    index("ranked_rating_leaderboard_idx")
      .on(table.ladderStep, table.tp, table.userId)
      .where(pastPlacementSql),
  ],
);

// Each of the two players of a finished Duel: their Result over its Rounds (`averageResult` of the
// engine), their Pace, the Rounds they won and what the Duel moved of their Rating. Their Rounds
// are in `duel_round`.
export const duelPlayer = pgTable(
  "duel_player",
  {
    duelId: text("duel_id")
      .notNull()
      .references(() => duel.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    wpm: doublePrecision("wpm").notNull(),
    raw: doublePrecision("raw").notNull(),
    accuracy: doublePrecision("accuracy").notNull(),
    consistency: doublePrecision("consistency").notNull(),
    correctChars: integer("correct_chars").notNull(),
    incorrectChars: integer("incorrect_chars").notNull(),
    extraChars: integer("extra_chars").notNull(),
    missedChars: integer("missed_chars").notNull(),
    // The Pace the Bursts were judged against, in wpm, null for the Duels written before it came
    // from the history. Every Duel written since has one.
    pace: doublePrecision("pace"),
    // What a ranked Duel moved: the TP (null in Placement) and the MMR. Both null for an unranked
    // Duel.
    tpDelta: integer("tp_delta"),
    mmrDelta: integer("mmr_delta"),
    // How many Rounds the player won: a drawn Round, or the one a Forfeit cut short, counts for
    // nobody.
    roundsWon: integer("rounds_won").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.duelId, table.userId] }),
    index("duel_player_userId_idx").on(table.userId),
  ],
);

// Each player of each Round of a finished Duel: its Text (Seed), its time, and the player's Result,
// Score and the Keystrokes the server accepted, which replay to them. The Round a Forfeit cut short
// ends at the Forfeit.
export const duelRound = pgTable(
  "duel_round",
  {
    duelId: text("duel_id")
      .notNull()
      .references(() => duel.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // From 0, in the order the Rounds were played.
    roundIndex: integer("round_index").notNull(),
    // A 32-bit unsigned Seed, as the Duel's.
    seed: bigint("seed", { mode: "number" }).notNull(),
    // The end of the Countdown or of the Round break before it.
    startedAt: timestamp("started_at").notNull(),
    // The end of its time, or the moment of the Forfeit.
    endedAt: timestamp("ended_at").notNull(),
    wpm: doublePrecision("wpm").notNull(),
    raw: doublePrecision("raw").notNull(),
    accuracy: doublePrecision("accuracy").notNull(),
    consistency: doublePrecision("consistency").notNull(),
    correctChars: integer("correct_chars").notNull(),
    incorrectChars: integer("incorrect_chars").notNull(),
    extraChars: integer("extra_chars").notNull(),
    missedChars: integer("missed_chars").notNull(),
    // The Score, null for the Duels written before it decided the winner: their outcome is still
    // the one of the time, by wpm. Every Duel written since has all three.
    score: integer("score"),
    bestCombo: integer("best_combo"),
    bursts: integer("bursts"),
    keystrokes: jsonb("keystrokes").$type<readonly Keystroke[]>().notNull(),
  },
  // The Records walk a User's Rounds.
  (table) => [
    primaryKey({ columns: [table.duelId, table.userId, table.roundIndex] }),
    index("duel_round_user_id_idx").on(table.userId),
  ],
);

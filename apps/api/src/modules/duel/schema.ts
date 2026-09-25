import { TIERS } from "ranked";
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

// A finished Duel: enough to replay it on its Text (Seed, Language, Word list version, Mode) and
// its outcome. A Duel still running when the API stops is never written (ADR 0003).
export const duel = pgTable("duel", {
  id: text("id").primaryKey(),
  // A 32-bit unsigned Seed: past the range of a Postgres integer.
  seed: bigint("seed", { mode: "number" }).notNull(),
  language: text("language", { enum: ["fr", "en"] }).notNull(),
  wordListVersion: integer("word_list_version").notNull(),
  mode: text("mode", { enum: ["time"] }).notNull(),
  seconds: integer("seconds").notNull(),
  // The end of the Countdown.
  startedAt: timestamp("started_at").notNull(),
  // The end of its time, or the moment of the Forfeit.
  endedAt: timestamp("ended_at").notNull(),
  outcome: text("outcome", { enum: DUEL_OUTCOMES }).notNull(),
  // Null for a Draw, or once the winner's User is deleted.
  winnerId: text("winner_id").references(() => user.id, { onDelete: "set null" }),
  // A Duel of the Queue, which moved both Ratings; false for a Challenge and for the Duels played
  // before ranked existed.
  ranked: boolean("ranked").notNull().default(false),
});

// A User's Rating (ranked package): the hidden MMR and the visible rank. Created on their first
// join of the Queue, from their Pace; moved by each ranked Duel, written with it.
export const rankedRating = pgTable("ranked_rating", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  mmr: integer("mmr").notNull(),
  // Below PLACEMENT_DUELS, the User is in Placement: no Tier yet.
  placementsPlayed: integer("placements_played").notNull(),
  // Null in Placement.
  tier: text("tier", { enum: TIERS }),
  // Null in Placement and in Maître.
  division: integer("division"),
  tp: integer("tp").notNull(),
  // Just moved up: the next loss below 0 TP keeps the Division.
  shielded: boolean("shielded").notNull(),
});

// Each of the two players of a finished Duel: their Result and the Keystrokes the server accepted,
// which replay to it.
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
    // The Score, null for the Duels written before it decided the winner: their outcome is still
    // the one of the time, by wpm. Every Duel written since has all three.
    score: integer("score"),
    bestCombo: integer("best_combo"),
    bursts: integer("bursts"),
    // What a ranked Duel moved: the TP (null in Placement) and the MMR. Both null for an unranked
    // Duel.
    tpDelta: integer("tp_delta"),
    mmrDelta: integer("mmr_delta"),
    keystrokes: jsonb("keystrokes").$type<readonly Keystroke[]>().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.duelId, table.userId] }),
    index("duel_player_userId_idx").on(table.userId),
  ],
);

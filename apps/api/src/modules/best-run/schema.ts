import {
  bigint,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Keystroke } from "typing-engine";

import { user } from "../../database/auth-schema";

// A User's Best Run of a setting (ADR 0016): enough to replay it on its Text (Seed, Language, Word
// list version, Mode and length) and the Result the server computed from its Keystrokes.
export const bestRun = pgTable(
  "best_run",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mode: text("mode", { enum: ["time", "words"] }).notNull(),
    // Seconds for a `time` Run, words for a `words` Run.
    length: integer("length").notNull(),
    language: text("language", { enum: ["fr", "en"] }).notNull(),
    // A 32-bit unsigned Seed: past the range of a Postgres integer.
    seed: bigint("seed", { mode: "number" }).notNull(),
    wordListVersion: integer("word_list_version").notNull(),
    keystrokes: jsonb("keystrokes").$type<readonly Keystroke[]>().notNull(),
    wpm: doublePrecision("wpm").notNull(),
    raw: doublePrecision("raw").notNull(),
    accuracy: doublePrecision("accuracy").notNull(),
    consistency: doublePrecision("consistency").notNull(),
    correctChars: integer("correct_chars").notNull(),
    incorrectChars: integer("incorrect_chars").notNull(),
    extraChars: integer("extra_chars").notNull(),
    missedChars: integer("missed_chars").notNull(),
    // When the Run was sent.
    sentAt: timestamp("sent_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.mode, table.length, table.language] })],
);

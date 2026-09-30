import { and, eq, sql } from "drizzle-orm";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";

import type { Table } from "../../database/schema";
import type { RunSetting } from "./model";
import { bestRun } from "./schema";
import type { BestRunRecord, BestRunStore } from "./store";

// Everything but the key: what a faster Run replaces.
const runFields = ({ seed, wordListVersion, keystrokes, result, at }: BestRunRecord) => ({
  seed,
  wordListVersion,
  keystrokes,
  wpm: result.wpm,
  raw: result.raw,
  accuracy: result.accuracy,
  consistency: result.consistency,
  correctChars: result.chars.correct,
  incorrectChars: result.chars.incorrect,
  extraChars: result.chars.extra,
  missedChars: result.chars.missed,
  sentAt: new Date(at),
});

const rowOf = (run: BestRunRecord) => ({
  userId: run.userId,
  mode: run.setting.mode,
  length: run.setting.length,
  language: run.setting.language,
  ...runFields(run),
});

// The row read for `setting`: its setting is the one asked for.
const recordOf = (row: typeof bestRun.$inferSelect, setting: RunSetting): BestRunRecord => ({
  userId: row.userId,
  setting,
  seed: row.seed,
  wordListVersion: row.wordListVersion,
  keystrokes: row.keystrokes,
  result: {
    wpm: row.wpm,
    raw: row.raw,
    accuracy: row.accuracy,
    consistency: row.consistency,
    chars: {
      correct: row.correctChars,
      incorrect: row.incorrectChars,
      extra: row.extraChars,
      missed: row.missedChars,
    },
  },
  at: row.sentAt.getTime(),
});

// The production BestRunStore. A Run is kept by one upsert, which only replaces a slower Best Run:
// two Runs sent at once keep the faster one.
export const drizzleBestRunStore = (db: BunSQLDatabase<Table>): BestRunStore => {
  const read = async (userId: string, setting: RunSetting) => {
    const [row] = await db
      .select()
      .from(bestRun)
      .where(
        and(
          eq(bestRun.userId, userId),
          eq(bestRun.mode, setting.mode),
          eq(bestRun.length, setting.length),
          eq(bestRun.language, setting.language),
        ),
      );

    return row ? recordOf(row, setting) : null;
  };

  return {
    bestRun: read,
    keepIfBetter: async (run) => {
      await db
        .insert(bestRun)
        .values(rowOf(run))
        .onConflictDoUpdate({
          target: [bestRun.userId, bestRun.mode, bestRun.length, bestRun.language],
          set: runFields(run),
          setWhere: sql`${bestRun.wpm} < excluded.wpm`,
        });

      const record = await read(run.userId, run.setting);

      if (record === null) {
        throw new Error(`Best Run of ${run.userId} not written`);
      }

      return record;
    },
  };
};

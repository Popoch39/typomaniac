import type { BunSQLDatabase } from "drizzle-orm/bun-sql";

import type { DuelPlayerRecord, DuelStore } from "../duel/duel-store";
import { duel, duelPlayer } from "./duel-schema";
import type { Table } from "./schema";

const playerRow = (duelId: string, { userId, result, keystrokes }: DuelPlayerRecord) => ({
  duelId,
  userId,
  wpm: result.wpm,
  raw: result.raw,
  accuracy: result.accuracy,
  consistency: result.consistency,
  correctChars: result.chars.correct,
  incorrectChars: result.chars.incorrect,
  extraChars: result.chars.extra,
  missedChars: result.chars.missed,
  keystrokes,
});

// The production DuelStore: a finished Duel and its two players, in one transaction.
export const drizzleDuelStore = (db: BunSQLDatabase<Table>): DuelStore => ({
  save: async (record) => {
    await db.transaction(async (tx) => {
      await tx.insert(duel).values({
        id: record.id,
        seed: record.seed,
        language: record.language,
        wordListVersion: record.wordListVersion,
        mode: record.mode,
        seconds: record.seconds,
        startedAt: new Date(record.startsAt),
        endedAt: new Date(record.endedAt),
        outcome: record.outcome,
        winnerId: record.winnerId,
      });
      await tx
        .insert(duelPlayer)
        .values(record.players.map((player) => playerRow(record.id, player)));
    });
  },
});

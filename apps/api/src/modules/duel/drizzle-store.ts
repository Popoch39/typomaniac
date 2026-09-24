import { and, desc, eq, lt, ne, or } from "drizzle-orm";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { alias } from "drizzle-orm/pg-core";

import type { Table } from "../../database/schema";
import { duel, duelPlayer } from "./schema";
import type { DuelCursor, DuelPlayerRecord, DuelStore } from "./store";

const playerRow = (
  duelId: string,
  { userId, result, pace, score, keystrokes }: DuelPlayerRecord,
) => ({
  duelId,
  userId,
  pace,
  wpm: result.wpm,
  raw: result.raw,
  accuracy: result.accuracy,
  consistency: result.consistency,
  correctChars: result.chars.correct,
  incorrectChars: result.chars.incorrect,
  extraChars: result.chars.extra,
  missedChars: result.chars.missed,
  score: score === null ? null : score.score,
  bestCombo: score === null ? null : score.bestCombo,
  bursts: score === null ? null : score.bursts,
  keystrokes,
});

// The other player of the Duel, next to the one who reads their Duel history.
const opponentPlayer = alias(duelPlayer, "opponent_player");

// The Duels before the cursor, by end then by id: one ended earlier, or at the same instant with a
// smaller id.
const before = ({ endedAt, id }: DuelCursor) => {
  const at = new Date(endedAt);

  return or(lt(duel.endedAt, at), and(eq(duel.endedAt, at), lt(duel.id, id)));
};

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
  recentWpms: async (userId, count) => {
    const rows = await db
      .select({ wpm: duelPlayer.wpm })
      .from(duelPlayer)
      .innerJoin(duel, eq(duel.id, duelPlayer.duelId))
      .where(eq(duelPlayer.userId, userId))
      .orderBy(desc(duel.endedAt))
      .limit(count);

    return rows.map((row) => row.wpm);
  },
  // Served by the player index on the User: a User's Duels are few enough to sort.
  history: async (userId, page) => {
    const rows = await db
      .select({
        id: duel.id,
        endedAt: duel.endedAt,
        outcome: duel.outcome,
        winnerId: duel.winnerId,
        wpm: duelPlayer.wpm,
        score: duelPlayer.score,
        opponentId: opponentPlayer.userId,
        opponentWpm: opponentPlayer.wpm,
        opponentScore: opponentPlayer.score,
      })
      .from(duelPlayer)
      .innerJoin(duel, eq(duel.id, duelPlayer.duelId))
      .leftJoin(
        opponentPlayer,
        and(eq(opponentPlayer.duelId, duel.id), ne(opponentPlayer.userId, userId)),
      )
      .where(and(eq(duelPlayer.userId, userId), page.before ? before(page.before) : undefined))
      .orderBy(desc(duel.endedAt), desc(duel.id))
      .limit(page.limit);

    return rows.map((row) => ({
      id: row.id,
      endedAt: row.endedAt.getTime(),
      outcome: row.outcome,
      winnerId: row.winnerId,
      player: { userId, wpm: row.wpm, score: row.score },
      opponent:
        row.opponentId === null || row.opponentWpm === null
          ? null
          : { userId: row.opponentId, wpm: row.opponentWpm, score: row.opponentScore },
    }));
  },
});

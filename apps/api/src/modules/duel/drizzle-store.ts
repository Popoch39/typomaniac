import { and, count as countRows, desc, eq, lt, max, ne, or, sql } from "drizzle-orm";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { alias } from "drizzle-orm/pg-core";

import type { Table } from "../../database/schema";
import { duel, duelPlayer } from "./schema";
import type { DuelCursor, DuelPlayerRecord, DuelStore, PlayedDuelPlayer } from "./store";

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

const playerOf = (row: typeof duelPlayer.$inferSelect): PlayedDuelPlayer => ({
  userId: row.userId,
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
  pace: row.pace,
  // All three or none: written together since the Score.
  score:
    row.score === null || row.bestCombo === null || row.bursts === null
      ? null
      : { score: row.score, bestCombo: row.bestCombo, bursts: row.bursts },
  keystrokes: row.keystrokes,
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
  // The Duel and its player rows, one per User still there.
  playedDuel: async (userId, duelId) => {
    const rows = await db
      .select()
      .from(duel)
      .innerJoin(duelPlayer, eq(duelPlayer.duelId, duel.id))
      .where(eq(duel.id, duelId));

    const own = rows.find((row) => row.duel_player.userId === userId);

    if (!own) {
      return null;
    }

    const opponent = rows.find((row) => row.duel_player.userId !== userId);
    const { duel: played } = own;

    return {
      id: played.id,
      seed: played.seed,
      language: played.language,
      wordListVersion: played.wordListVersion,
      mode: played.mode,
      seconds: played.seconds,
      startsAt: played.startedAt.getTime(),
      endedAt: played.endedAt.getTime(),
      outcome: played.outcome,
      winnerId: played.winnerId,
      player: playerOf(own.duel_player),
      opponent: opponent ? playerOf(opponent.duel_player) : null,
    };
  },
  // One pass over the User's player rows. A loss is neither a win nor a Draw: a deleted winner
  // leaves `winner_id` null on a Duel that was not a Draw.
  stats: async (userId) => {
    const [row] = await db
      .select({
        duels: countRows(),
        wins: sql<number>`count(*) filter (where ${duel.winnerId} = ${userId})`.mapWith(Number),
        draws: sql<number>`count(*) filter (where ${duel.outcome} = 'draw')`.mapWith(Number),
        wpm: sql<number | null>`avg(${duelPlayer.wpm})`.mapWith(Number),
        accuracy: sql<number | null>`avg(${duelPlayer.accuracy})`.mapWith(Number),
        bestWpm: max(duelPlayer.wpm),
        bestScore: max(duelPlayer.score),
        bestCombo: max(duelPlayer.bestCombo),
      })
      .from(duelPlayer)
      .innerJoin(duel, eq(duel.id, duelPlayer.duelId))
      .where(eq(duelPlayer.userId, userId));

    const duels = row?.duels ?? 0;
    const wins = row?.wins ?? 0;
    const draws = row?.draws ?? 0;

    return {
      duels,
      record: { wins, losses: duels - wins - draws, draws },
      // `mapWith(Number)` would read the null average of no row as 0.
      averages: {
        wpm: duels === 0 ? null : (row?.wpm ?? null),
        accuracy: duels === 0 ? null : (row?.accuracy ?? null),
      },
      records: {
        wpm: row?.bestWpm ?? null,
        score: row?.bestScore ?? null,
        combo: row?.bestCombo ?? null,
      },
    };
  },
});

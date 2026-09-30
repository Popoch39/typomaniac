import { and, asc, count as countRows, desc, eq, inArray, lt, max, ne, or, sql } from "drizzle-orm";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { alias } from "drizzle-orm/pg-core";

import type { Table } from "../../database/schema";
import { DIVISIONS, PLACEMENT_DUELS, type Rating } from "ranked";

import type { Records } from "./model";
import { duel, duelPlayer, pastPlacementSql, rankedRating } from "./schema";
import type {
  DuelCursor,
  DuelPlayerRecord,
  DuelStore,
  LeaderboardKey,
  PlayedDuelPlayer,
} from "./store";

// A Rating as its row holds it: the Placement as a count of Duels played.
const ratingRow = (userId: string, { mmr, rank }: Rating) => ({
  userId,
  mmr,
  placementsPlayed:
    "placementsLeft" in rank ? PLACEMENT_DUELS - rank.placementsLeft : PLACEMENT_DUELS,
  tier: "tier" in rank ? rank.tier : null,
  division: "division" in rank ? rank.division : null,
  tp: "tp" in rank ? rank.tp : 0,
  shielded: "shielded" in rank ? rank.shielded : false,
});

// A row always written by ratingRow: past Placement, a Tier, and a Division below Maniac.
const ratingOf = (row: typeof rankedRating.$inferSelect): Rating => {
  const { mmr, placementsPlayed, tier, division, tp, shielded } = row;

  if (placementsPlayed < PLACEMENT_DUELS) {
    return { mmr, rank: { placementsLeft: PLACEMENT_DUELS - placementsPlayed } };
  }

  if (tier === "maniac") {
    return { mmr, rank: { tier, tp, shielded } };
  }

  const known = DIVISIONS.find((candidate) => candidate === division);

  if (tier === null || typeof known === "undefined") {
    throw new Error(`Malformed rating of ${row.userId}`);
  }

  return { mmr, rank: { tier, division: known, tp, shielded } };
};

// Where a row stands in the Leaderboard, compared as one against a key: `compareLeaderboardKeys`,
// read on `ranked_rating_leaderboard_idx`.
const leaderboardTuple = sql`(${rankedRating.ladderStep}, ${rankedRating.tp}, ${rankedRating.userId})`;

const keyTuple = ({ step, tp, userId }: LeaderboardKey) =>
  sql`(${step}::integer, ${tp}::integer, ${userId}::text)`;

const bestFirst = [desc(rankedRating.ladderStep), desc(rankedRating.tp), desc(rankedRating.userId)];

const worstFirst = [asc(rankedRating.ladderStep), asc(rankedRating.tp), asc(rankedRating.userId)];

// The rows of the Leaderboard, all past Placement.
const leaderboardRowsOf = (rows: (typeof rankedRating.$inferSelect)[]) =>
  rows.flatMap((row) => {
    const { rank } = ratingOf(row);

    return "placementsLeft" in rank ? [] : [{ userId: row.userId, standing: rank }];
  });

const playerRow = (
  duelId: string,
  { userId, result, pace, score, keystrokes, rated }: DuelPlayerRecord,
) => ({
  duelId,
  userId,
  pace,
  tpDelta: rated?.tp ?? null,
  mmrDelta: rated ? rated.after.mmr - rated.before.mmr : null,
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

// The Records over a User's player rows: the best wpm, Score and Combo, Challenges and Forfeits
// included. The Score's are null on the rows written before it.
const bestColumns = {
  bestWpm: max(duelPlayer.wpm),
  bestScore: max(duelPlayer.score),
  bestCombo: max(duelPlayer.bestCombo),
};

// The Records of the row `bestColumns` aggregates, all null without a Duel.
const recordsOf = (
  row: { bestWpm: number | null; bestScore: number | null; bestCombo: number | null } | undefined,
): Records => ({
  wpm: row?.bestWpm ?? null,
  score: row?.bestScore ?? null,
  combo: row?.bestCombo ?? null,
});

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
        ranked: record.players.every((player) => player.rated !== null),
      });
      await tx
        .insert(duelPlayer)
        .values(record.players.map((player) => playerRow(record.id, player)));

      const ratings = record.players.flatMap(({ userId, rated }) =>
        rated ? [ratingRow(userId, rated.after)] : [],
      );

      if (ratings.length > 0) {
        await tx
          .insert(rankedRating)
          .values(ratings)
          .onConflictDoUpdate({
            target: rankedRating.userId,
            set: {
              mmr: sql`excluded.mmr`,
              placementsPlayed: sql`excluded.placements_played`,
              tier: sql`excluded.tier`,
              division: sql`excluded.division`,
              tp: sql`excluded.tp`,
              shielded: sql`excluded.shielded`,
            },
          });
      }
    });
  },
  // Inserted unless there is one already, then read: two joins at once create it once.
  ensureRating: async (userId, initial) => {
    await db.insert(rankedRating).values(ratingRow(userId, initial)).onConflictDoNothing();

    const [row] = await db.select().from(rankedRating).where(eq(rankedRating.userId, userId));

    if (!row) {
      throw new Error(`Rating of ${userId} not written`);
    }

    return ratingOf(row);
  },
  leaderboardAfter: async (after, limit) =>
    leaderboardRowsOf(
      await db
        .select()
        .from(rankedRating)
        .where(
          and(pastPlacementSql, after ? sql`${leaderboardTuple} < ${keyTuple(after)}` : undefined),
        )
        .orderBy(...bestFirst)
        .limit(limit),
    ),
  leaderboardBefore: async (key, limit) => {
    if (limit === 0) {
      return [];
    }

    const rows = await db
      .select()
      .from(rankedRating)
      .where(and(pastPlacementSql, sql`${leaderboardTuple} > ${keyTuple(key)}`))
      .orderBy(...worstFirst)
      .limit(limit);

    return leaderboardRowsOf(rows.toReversed());
  },
  leaderboardPlace: async (key) => {
    const [row] = await db
      .select({ above: countRows() })
      .from(rankedRating)
      .where(and(pastPlacementSql, sql`${leaderboardTuple} > ${keyTuple(key)}`));

    return (row?.above ?? 0) + 1;
  },
  leaderboardSize: async () => {
    const [row] = await db.select({ size: countRows() }).from(rankedRating).where(pastPlacementSql);

    return row?.size ?? 0;
  },
  rankOf: async (userId) => {
    const [row] = await db.select().from(rankedRating).where(eq(rankedRating.userId, userId));

    return row ? ratingOf(row).rank : null;
  },
  ornamentChoiceOf: async (userId) => {
    const [row] = await db
      .select({ ornament: rankedRating.ornament })
      .from(rankedRating)
      .where(eq(rankedRating.userId, userId));

    return row?.ornament ?? "follow";
  },
  ornamentChoicesOf: async (userIds) => {
    const rows = await db
      .select()
      .from(rankedRating)
      .where(inArray(rankedRating.userId, [...userIds]));

    return rows.map((row) => ({
      userId: row.userId,
      rank: ratingOf(row).rank,
      choice: row.ornament,
    }));
  },
  setOrnamentChoice: async (userId, choice) => {
    await db.update(rankedRating).set({ ornament: choice }).where(eq(rankedRating.userId, userId));
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
  recentRankedDuels: async (userId, count) =>
    db
      .select({ outcome: duel.outcome, winnerId: duel.winnerId, wpm: duelPlayer.wpm })
      .from(duelPlayer)
      .innerJoin(duel, eq(duel.id, duelPlayer.duelId))
      .where(and(eq(duelPlayer.userId, userId), eq(duel.ranked, true)))
      .orderBy(desc(duel.endedAt), desc(duel.id))
      .limit(count),
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
        tp: duelPlayer.tpDelta,
        ranked: duel.ranked,
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
      tp: row.tp,
      ranked: row.ranked,
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
      tp: own.duel_player.tpDelta,
      ranked: played.ranked,
    };
  },
  // The last Duels read newest first, then turned around.
  progression: async (userId, limit) => {
    const query = db
      .select({
        endedAt: duel.endedAt,
        wpm: duelPlayer.wpm,
        raw: duelPlayer.raw,
        accuracy: duelPlayer.accuracy,
        consistency: duelPlayer.consistency,
      })
      .from(duelPlayer)
      .innerJoin(duel, eq(duel.id, duelPlayer.duelId))
      .where(and(eq(duelPlayer.userId, userId), ne(duel.outcome, "forfeit")))
      .orderBy(desc(duel.endedAt), desc(duel.id));

    const rows = await (limit === null ? query : query.limit(limit));

    return rows.toReversed().map(({ endedAt, wpm, raw, accuracy, consistency }) => ({
      endedAt: endedAt.getTime(),
      wpm,
      raw,
      accuracy,
      consistency,
    }));
  },
  // The Duels first, then the player rows of those Duels.
  recentDuelsOf: async (userIds, limit) => {
    if (userIds.length === 0) {
      return [];
    }

    const duels = await db
      .selectDistinct({
        id: duel.id,
        endedAt: duel.endedAt,
        outcome: duel.outcome,
        winnerId: duel.winnerId,
      })
      .from(duel)
      .innerJoin(duelPlayer, eq(duelPlayer.duelId, duel.id))
      .where(inArray(duelPlayer.userId, [...userIds]))
      .orderBy(desc(duel.endedAt), desc(duel.id))
      .limit(limit);

    if (duels.length === 0) {
      return [];
    }

    const players = await db
      .select({ duelId: duelPlayer.duelId, userId: duelPlayer.userId, wpm: duelPlayer.wpm })
      .from(duelPlayer)
      .where(
        inArray(
          duelPlayer.duelId,
          duels.map((row) => row.id),
        ),
      );

    return duels.map((row) => ({
      id: row.id,
      endedAt: row.endedAt.getTime(),
      outcome: row.outcome,
      winnerId: row.winnerId,
      players: players.flatMap(({ duelId, userId, wpm }) =>
        duelId === row.id ? [{ userId, wpm }] : [],
      ),
    }));
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
        ...bestColumns,
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
      records: recordsOf(row),
    };
  },
  // The same aggregate as the Stats' Records, alone.
  records: async (userId) => {
    const [row] = await db
      .select(bestColumns)
      .from(duelPlayer)
      .where(eq(duelPlayer.userId, userId));

    return recordsOf(row);
  },
});

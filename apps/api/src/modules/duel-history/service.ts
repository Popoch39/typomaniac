import { ApiError } from "../../lib/errors";
import {
  type DuelCursor,
  type DuelHistoryRow,
  type DuelStore,
  outcomeFor,
  type PlayedDuelPlayer,
} from "../duel/store";
import type { HandleMatch, Users } from "../user/users";
import type { DuelHistoryEntry, DuelHistoryPage, ReplayedDuel, ReplayedPlayer } from "./model";

// How many Duels a page of the Duel history holds.
export const DUEL_HISTORY_PAGE = 20;

export type DuelHistoryDeps = { store: DuelStore; users: Users };

const cursorOf = ({ endedAt, id }: DuelCursor) => `${endedAt}:${id}`;

// `<endedAt>:<id>`, its shape already checked by the query's schema.
const parseCursor = (cursor: string): DuelCursor => {
  const colon = cursor.indexOf(":");
  const endedAt = Number(cursor.slice(0, colon));

  if (!Number.isSafeInteger(endedAt)) {
    throw new ApiError("VALIDATION_FAILED", "Invalid cursor");
  }

  return { endedAt, id: cursor.slice(colon + 1) };
};

const entryOf = (
  userId: string,
  row: DuelHistoryRow,
  profiles: ReadonlyMap<string, NonNullable<DuelHistoryEntry["opponent"]>>,
): DuelHistoryEntry => ({
  id: row.id,
  endedAt: row.endedAt,
  opponent: row.opponent ? (profiles.get(row.opponent.userId) ?? null) : null,
  outcome: outcomeFor(userId, row),
  forfeit: row.outcome === "forfeit",
  score: row.player.score,
  opponentScore: row.opponent?.score ?? null,
  wpm: row.player.wpm,
  opponentWpm: row.opponent?.wpm ?? null,
});

// A page of the User's Duel history, the most recent first, from `before` when given. The
// opponents are read by id: their Handle of today, never their name.
export const duelHistory = async (
  { store, users }: DuelHistoryDeps,
  userId: string,
  before: string | undefined,
): Promise<DuelHistoryPage> => {
  // One more than a page: whether there is a next one.
  const rows = await store.history(userId, {
    before: before === undefined ? null : parseCursor(before),
    limit: DUEL_HISTORY_PAGE + 1,
  });

  const page = rows.slice(0, DUEL_HISTORY_PAGE);

  const opponents = await users.profilesOf([
    ...new Set(page.flatMap((row) => (row.opponent ? [row.opponent.userId] : []))),
  ]);

  const profiles = new Map(opponents.map(({ id, handle, image }) => [id, { handle, image }]));

  const last = page.at(-1);

  return {
    duels: page.map((row) => entryOf(userId, row, profiles)),
    next: rows.length > DUEL_HISTORY_PAGE && last ? cursorOf(last) : null,
  };
};

const replayedPlayer = (
  profile: Pick<HandleMatch, "handle" | "image">,
  { result, pace, score, keystrokes }: PlayedDuelPlayer,
): ReplayedPlayer => ({ ...profile, result, pace, score, keystrokes: [...keystrokes] });

// The Duel `duelId` for the User who replays it, both sides read by id: their Handle of today. Not
// found for anyone who did not play it, the same as a Duel that does not exist.
export const replayedDuel = async (
  { store, users }: DuelHistoryDeps,
  userId: string,
  duelId: string,
): Promise<ReplayedDuel> => {
  const played = await store.playedDuel(userId, duelId);

  if (played === null) {
    throw new ApiError("NOT_FOUND", "Duel not found");
  }

  const profiles = new Map(
    (await users.profilesOf(played.opponent ? [userId, played.opponent.userId] : [userId])).map(
      (profile) => [profile.id, profile],
    ),
  );

  const own = profiles.get(userId);

  // A User who played a Duel had a Handle, and a Handle is never taken back.
  if (!own) {
    throw new ApiError("NOT_FOUND", "Duel not found");
  }

  const opponent = played.opponent && profiles.get(played.opponent.userId);

  return {
    id: played.id,
    seed: played.seed,
    language: played.language,
    wordListVersion: played.wordListVersion,
    seconds: played.seconds,
    startsAt: played.startsAt,
    endedAt: played.endedAt,
    outcome: outcomeFor(userId, played),
    forfeit: played.outcome === "forfeit",
    me: replayedPlayer(own, played.player),
    opponent: played.opponent && opponent ? replayedPlayer(opponent, played.opponent) : null,
  };
};

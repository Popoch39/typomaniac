import { computeTimeline, type RunConfig } from "typing-engine";

import { ApiError } from "../../lib/errors";
import {
  type DuelStore,
  type HistoryRange,
  outcomeFor,
  type PlayedDuel,
  type PlayedDuelPlayer,
} from "../duel/store";
import type { HandleMatch, Users } from "../user/users";
import type {
  DuelHistoryActivity,
  DuelHistoryEntry,
  DuelHistoryWeek,
  ReplayedDuel,
  ReplayedPlayer,
} from "./model";

const DAY_MS = 24 * 60 * 60 * 1000;

// The longest week the client may ask for: seven days, and the hour a change of time gives one.
export const MAX_WEEK_MS = 8 * DAY_MS;

// The longest stretch of Activity: the 16 weeks the page shows, and some.
export const MAX_ACTIVITY_MS = 120 * DAY_MS;

// The most Duels a week shows: each one is replayed for its wpm by second.
export const WEEK_DUELS_LIMIT = 300;

export type DuelHistoryDeps = { store: DuelStore; users: Users };

// The range as asked: `from` before `to`, at most `longest` apart.
const checkedRange = (range: HistoryRange, longest: number): HistoryRange => {
  if (range.to <= range.from || range.to - range.from > longest) {
    throw new ApiError("VALIDATION_FAILED", "Invalid range");
  }

  return range;
};

// An IANA time zone that this runtime knows: the same names as Postgres's.
const checkedTimeZone = (timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en", { timeZone }).resolvedOptions().timeZone;
  } catch {
    throw new ApiError("VALIDATION_FAILED", "Unknown time zone");
  }
};

// The wpm of each second of a side, replayed from their Keystrokes up to the Duel's end: its time,
// or the Forfeit when it came first.
const wpmBySecondOf = (played: PlayedDuel, player: PlayedDuelPlayer) => {
  const config: RunConfig = {
    mode: "time",
    seconds: played.seconds,
    language: played.language,
    wordListVersion: played.wordListVersion,
    seed: played.seed,
  };

  const duration = Math.max(0, Math.min(played.seconds * 1000, played.endedAt - played.startsAt));

  return computeTimeline(config, player.keystrokes, duration).map(({ wpm }) => Math.round(wpm));
};

const entryOf = (
  userId: string,
  played: PlayedDuel,
  profiles: ReadonlyMap<string, NonNullable<DuelHistoryEntry["opponent"]>>,
): DuelHistoryEntry => ({
  id: played.id,
  endedAt: played.endedAt,
  opponent: played.opponent ? (profiles.get(played.opponent.userId) ?? null) : null,
  outcome: outcomeFor(userId, played),
  forfeit: played.outcome === "forfeit",
  score: played.player.score?.score ?? null,
  opponentScore: played.opponent?.score?.score ?? null,
  wpm: played.player.result.wpm,
  opponentWpm: played.opponent?.result.wpm ?? null,
  tp: played.tp,
  ranked: played.ranked,
  wpmBySecond: wpmBySecondOf(played, played.player),
  opponentWpmBySecond: played.opponent ? wpmBySecondOf(played, played.opponent) : null,
});

// The User's Duels that ended in `range` (a week of their time zone), the most recent first. The
// opponents are read by id: their Handle of today, never their name.
export const historyWeek = async (
  { store, users }: DuelHistoryDeps,
  userId: string,
  range: HistoryRange,
): Promise<DuelHistoryWeek> => {
  const played = await store.historyBetween(
    userId,
    checkedRange(range, MAX_WEEK_MS),
    WEEK_DUELS_LIMIT,
  );

  const opponents = await users.profilesOf([
    ...new Set(played.flatMap((duel) => (duel.opponent ? [duel.opponent.userId] : []))),
  ]);

  const profiles = new Map(opponents.map(({ id, handle, image }) => [id, { handle, image }]));

  return { duels: played.map((duel) => entryOf(userId, duel, profiles)) };
};

// How many Duels the User finished on each day of `timeZone` in `range`, and when they finished
// their first.
export const historyActivity = async (
  { store }: Pick<DuelHistoryDeps, "store">,
  userId: string,
  range: HistoryRange,
  timeZone: string,
): Promise<DuelHistoryActivity> => {
  const checked = checkedRange(range, MAX_ACTIVITY_MS);
  const zone = checkedTimeZone(timeZone);

  const [days, first] = await Promise.all([
    store.activity(userId, checked, zone),
    store.firstDuelAt(userId),
  ]);

  return { days, first };
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
    tp: played.tp,
    ranked: played.ranked,
    me: replayedPlayer(own, played.player),
    opponent: played.opponent && opponent ? replayedPlayer(opponent, played.opponent) : null,
  };
};

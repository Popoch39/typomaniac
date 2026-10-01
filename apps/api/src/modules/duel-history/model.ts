import { t } from "elysia";

import { DuelModel } from "../duel/model";

// An instant in ms since the epoch, as the client asks for a stretch of the Duel history.
const instant = t.Integer({ minimum: 0 });

// The stretch `[from, to)` of the Duel history the client asks for: a week in its time zone.
const range = t.Object({ from: instant, to: instant });

// A finished Duel of the User's Duel history, seen from them.
const duelHistoryEntry = t.Object({
  id: t.String(),
  // In ms since the epoch: the end of its time, or the moment of the Forfeit.
  endedAt: t.Number(),
  // Their Handle and avatar of today, read by id; null once their User is deleted.
  opponent: t.Nullable(DuelModel.opponent),
  outcome: t.UnionEnum(["win", "loss", "draw"]),
  // The loser forfeited.
  forfeit: t.Boolean(),
  // The Scores of the last Round, null for the Duels played before the Score.
  score: t.Nullable(t.Integer()),
  opponentScore: t.Nullable(t.Integer()),
  // The wpm over the Rounds.
  wpm: t.Number(),
  // Null once the opponent's User is deleted, with their Score.
  opponentWpm: t.Nullable(t.Number()),
  // The TP the Duel moved for the reader, never the MMR: null for a Challenge, a Duel in Placement
  // or one played before the ranked.
  tp: t.Nullable(t.Integer()),
  // A Ranked Duel, Placement included: false for a Challenge and for a Duel played before the ranked.
  ranked: t.Boolean(),
  // The wpm of each second of the reader's Run in the last Round, replayed from their Keystrokes,
  // rounded; up to the Forfeit when there was one.
  wpmBySecond: t.Array(t.Integer()),
  // The opponent's the same way; null once their User is deleted.
  opponentWpmBySecond: t.Nullable(t.Array(t.Integer())),
});

export type DuelHistoryEntry = typeof duelHistoryEntry.static;

// A day of the User's Activity in their time zone, `YYYY-MM-DD`, and how many Duels they finished.
const activityDay = t.Object({ day: t.String(), duels: t.Integer() });

export type ActivityDay = typeof activityDay.static;

// One of the two Users of a replayed Duel: their Handle and avatar of today, their Result over the
// Rounds, the Pace their Bursts were judged against and how many Rounds they won.
const replayedPlayer = t.Composite([
  DuelModel.opponent,
  t.Object({
    result: DuelModel.result,
    // Null for the Duels written before the Pace came from the history.
    pace: t.Nullable(t.Number()),
    roundsWon: t.Integer(),
  }),
]);

export type ReplayedPlayer = typeof replayedPlayer.static;

// One User's side of a replayed Round: what replays it (the Keystrokes the server accepted, with
// the Pace of the Duel) to the Result and Score they got.
const replayedRoundSide = t.Object({
  result: DuelModel.result,
  // Null for the Duels played before the Score.
  score: t.Nullable(DuelModel.score),
  keystrokes: t.Array(DuelModel.keystroke),
});

export type ReplayedRoundSide = typeof replayedRoundSide.static;

// A played Round of a replayed Duel: its index from 0, its Text (Seed), its time (`seconds`, from
// `startsAt` to `endedAt`: the end of its time, or the Forfeit that cut it short), and both sides.
const replayedRound = t.Object({
  index: t.Integer(),
  seed: t.Integer(),
  seconds: t.Integer(),
  startsAt: t.Number(),
  endedAt: t.Number(),
  me: replayedRoundSide,
  // Null once the opponent's User is deleted.
  opponent: t.Nullable(replayedRoundSide),
});

export type ReplayedRound = typeof replayedRound.static;

// A finished Duel seen from the User who replays it: what its Rounds are played in (Language, Word
// list version, seconds), its time, how it ended for them, whether it was Ranked and the TP it moved
// for them (as in the Duel history), how many Rounds won it, both Users, and its Rounds.
const replayedDuel = t.Composite([
  t.Omit(DuelModel.duel, ["seed"]),
  t.Pick(duelHistoryEntry, ["tp", "ranked"]),
  t.Object({
    endedAt: t.Number(),
    outcome: t.UnionEnum(["win", "loss", "draw"]),
    forfeit: t.Boolean(),
    me: replayedPlayer,
    // Null once the opponent's User is deleted.
    opponent: t.Nullable(replayedPlayer),
    // The Rounds played, the first first: never one that was not.
    rounds: t.Array(replayedRound, { minItems: 1 }),
  }),
]);

export type ReplayedDuel = typeof replayedDuel.static;

export const DuelHistoryModel = {
  weekQuery: range,
  // The Duels of the week, the most recent first.
  week: t.Object({ duels: t.Array(duelHistoryEntry) }),
  // An IANA time zone (`Europe/Paris`), checked by the service: the days are counted in it.
  activityQuery: t.Composite([range, t.Object({ timeZone: t.String({ maxLength: 64 }) })]),
  // The days with at least one Duel, the oldest first, and when the User finished their first Duel
  // (null without one): no week before it holds any.
  activity: t.Object({ days: t.Array(activityDay), first: t.Nullable(t.Number()) }),
  duelParams: t.Object({ duelId: t.String({ maxLength: 200 }) }),
  duel: replayedDuel,
};

export type DuelHistoryWeek = typeof DuelHistoryModel.week.static;

export type DuelHistoryActivity = typeof DuelHistoryModel.activity.static;

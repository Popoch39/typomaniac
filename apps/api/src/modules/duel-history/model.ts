import { t } from "elysia";

import { DuelModel } from "../duel/model";

// Where a page starts: `<endedAt>:<id>` of the last Duel of the page before, as `next` gives it.
const cursor = t.String({ pattern: "^\\d+:.+$", maxLength: 200 });

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
  // The Scores, null for the Duels played before the Score.
  score: t.Nullable(t.Integer()),
  opponentScore: t.Nullable(t.Integer()),
  wpm: t.Number(),
  // Null once the opponent's User is deleted, with their Score.
  opponentWpm: t.Nullable(t.Number()),
  // The TP the Duel moved for the reader, never the MMR: null for a Challenge, a Duel in Placement
  // or one played before the ranked.
  tp: t.Nullable(t.Integer()),
});

export type DuelHistoryEntry = typeof duelHistoryEntry.static;

// One of the two Users of a replayed Duel: their Handle and avatar of today, and what replays their
// side (the Keystrokes the server accepted, their Pace) to the Result and Score they got.
const replayedPlayer = t.Composite([
  DuelModel.opponent,
  t.Object({
    result: DuelModel.result,
    // Null for the Duels written before the Pace came from the history.
    pace: t.Nullable(t.Number()),
    // Null for the Duels played before the Score.
    score: t.Nullable(DuelModel.score),
    keystrokes: t.Array(DuelModel.keystroke),
  }),
]);

export type ReplayedPlayer = typeof replayedPlayer.static;

// A finished Duel seen from the User who replays it: its Text (Seed, Language, Word list version),
// its time, how it ended for them, their side (`me`) and the opponent's.
const replayedDuel = t.Composite([
  DuelModel.duel,
  t.Object({
    endedAt: t.Number(),
    outcome: t.UnionEnum(["win", "loss", "draw"]),
    forfeit: t.Boolean(),
    me: replayedPlayer,
    // Null once the opponent's User is deleted.
    opponent: t.Nullable(replayedPlayer),
  }),
]);

export type ReplayedDuel = typeof replayedDuel.static;

export const DuelHistoryModel = {
  query: t.Object({ before: t.Optional(cursor) }),
  // The most recent first; `next` is where the next page starts, null on the last one.
  page: t.Object({ duels: t.Array(duelHistoryEntry), next: t.Nullable(cursor) }),
  duelParams: t.Object({ duelId: t.String({ maxLength: 200 }) }),
  duel: replayedDuel,
};

export type DuelHistoryPage = typeof DuelHistoryModel.page.static;

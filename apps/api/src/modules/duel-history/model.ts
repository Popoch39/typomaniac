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
});

export type DuelHistoryEntry = typeof duelHistoryEntry.static;

export const DuelHistoryModel = {
  query: t.Object({ before: t.Optional(cursor) }),
  // The most recent first; `next` is where the next page starts, null on the last one.
  page: t.Object({ duels: t.Array(duelHistoryEntry), next: t.Nullable(cursor) }),
};

export type DuelHistoryPage = typeof DuelHistoryModel.page.static;

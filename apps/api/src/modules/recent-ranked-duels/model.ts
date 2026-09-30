import { t } from "elysia";

import { DuelModel } from "../duel/model";

// A player of a won Ranked Duel as Jouer lists it: their Handle of today and their wpm.
const recentRankedPlayer = t.Object({ handle: t.String(), wpm: t.Number() });

// A finished Ranked Duel someone won: « @mia bat @noe · 104 – 97 ».
const recentRankedDuel = t.Object({
  id: t.String(),
  // In ms since the epoch: the end of its time, or the moment of the Forfeit.
  endedAt: t.Number(),
  winner: recentRankedPlayer,
  loser: recentRankedPlayer,
});

export const RecentRankedDuelsModel = {
  // The reader's Tier of today, whose Duels these are; null for every Tier (in Placement or
  // without a Rating). The most recent first.
  recentDuels: t.Object({
    tier: t.Nullable(DuelModel.tier),
    duels: t.Array(recentRankedDuel),
  }),
};

export type RecentRankedDuels = typeof RecentRankedDuelsModel.recentDuels.static;

import { DIVISION_TP, PLACEMENT_DUELS, type Standing } from "ranked";

import type { RankChange } from "@/components/duel/rank-change";

// The TP bar of the Division, in TP out of 100 as the board draws it: what the Duel kept, from 0,
// then what it moved, gained or lost, `from` so many TP and `width` TP wide.
export type TpBar = { kept: number; move: "gained" | "lost"; from: number; width: number };

// Said over the rank when the Duel changed it: a Division up or down, or the last Placement.
export type RankHeadline = "promotion" | "demotion" | "placed";

// The rank card of the end screen: the Placement Duels played, or the rank after the Duel with
// the TP it moved (null for the last Placement, which moved none), its headline and its bar
// (none in Maniac, which has no ceiling).
export type RankCard =
  | { kind: "placement"; played: number; left: number }
  | {
      kind: "standing";
      standing: Standing;
      tp: number | null;
      headline: RankHeadline | null;
      bar: TpBar | null;
    };

// Within the Division: kept up to the lower of before and after, then the gap. Promoted: nothing
// kept, the new Division gained from 0. Demoted: kept up to the TP after it, lost from there to
// the top of the Division.
const barOf = (change: Extract<RankChange, { kind: "moved" | "promoted" | "demoted" }>): TpBar => {
  const after = change.standing.tp;

  if (change.kind === "promoted") {
    return { kept: 0, move: "gained", from: 0, width: after };
  }

  if (change.kind === "demoted") {
    return { kept: after, move: "lost", from: after, width: DIVISION_TP - after };
  }

  const kept = Math.min(change.from.tp, after);

  return {
    kept,
    move: change.tp >= 0 ? "gained" : "lost",
    from: kept,
    width: Math.abs(after - change.from.tp),
  };
};

const HEADLINES = { moved: null, promoted: "promotion", demoted: "demotion" } as const;

export const rankCardOf = (change: RankChange): RankCard => {
  if (change.kind === "placement") {
    return {
      kind: "placement",
      played: PLACEMENT_DUELS - change.placementsLeft,
      left: change.placementsLeft,
    };
  }

  if (change.kind === "revealed") {
    const { standing } = change;
    const bar: TpBar = { kept: standing.tp, move: "gained", from: standing.tp, width: 0 };

    return {
      kind: "standing",
      standing,
      tp: null,
      headline: "placed",
      bar: standing.tier === "maniac" ? null : bar,
    };
  }

  return {
    kind: "standing",
    standing: change.standing,
    tp: change.tp,
    headline: HEADLINES[change.kind],
    bar: change.standing.tier === "maniac" ? null : barOf(change),
  };
};

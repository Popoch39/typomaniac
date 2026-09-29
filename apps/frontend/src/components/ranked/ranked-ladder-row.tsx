import { cn } from "cn";

import { RankedDivisionTicks } from "@/components/ranked/ranked-division-ticks";
import type { LadderReach, LadderRow } from "@/components/ranked/tier-ladder";
import { TierEmblem } from "@/components/tier/drawing/tier-emblem";
import { TIER_COLORS, TIER_NAMES } from "@/components/tier/tier";

// The name of a Tier: in its colour for the reader's, faint for those still ahead.
const nameColor = (row: LadderRow) => {
  const colors: Record<LadderReach, string> = {
    mine: TIER_COLORS[row.tier],
    ahead: "text-faint",
    climbed: "text-foreground",
    open: "text-foreground",
  };

  return colors[row.reach];
};

// A Tier of the ladder: its step, its Emblem, its name in large, « ← toi » on the reader's, then
// its Divisions, those climbed lit.
export const RankedLadderRow = ({ row }: { row: LadderRow }) => {
  const mine = row.reach === "mine";
  const ahead = row.reach === "ahead";

  return (
    <li
      aria-current={mine ? "true" : undefined}
      data-ahead={ahead ? "" : undefined}
      className="flex flex-1 basis-0 items-center gap-6 border-t border-secondary"
    >
      <span className="w-7 font-mono text-xs text-faint">{row.number}</span>
      <span className={cn("size-7.5 shrink-0", ahead ? "opacity-45" : null)}>
        <TierEmblem tier={row.tier} />
      </span>
      <span className={cn("flex-1 text-[44px] font-bold tracking-[-0.035em]", nameColor(row))}>
        {TIER_NAMES[row.tier]}
      </span>
      {mine ? <span className="font-mono text-xs text-primary">← toi</span> : null}
      <RankedDivisionTicks row={row} />
    </li>
  );
};

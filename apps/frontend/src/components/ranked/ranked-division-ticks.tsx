import { cn } from "cn";

import type { TierRow } from "@/components/ranked/tier-rows";
import { TIER_COLORS } from "@/components/tier/tier";

// One mark per Division, from IV, the lowest, up to I.
const MARKS = [1, 2, 3, 4];

// A Tier's Divisions at the end of its row, Maniac's one summit: those climbed in the Tier's
// colour, the others dark. Only seen: the reader's rank is written in « Ta place ».
export const RankedDivisionTicks = ({ row }: { row: TierRow }) => (
  <span aria-hidden className={cn("flex w-45 justify-end gap-1.5", TIER_COLORS[row.tier])}>
    {MARKS.slice(0, row.divisions).map((mark) => (
      <span
        key={mark}
        data-division-tick
        data-lit={mark <= row.lit ? "" : undefined}
        className="h-0.75 w-9 rounded-xs bg-secondary data-lit:bg-current"
      />
    ))}
  </span>
);

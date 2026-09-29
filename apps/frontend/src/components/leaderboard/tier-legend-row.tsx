import { cn } from "cn";
import type { Tier } from "ranked";

import { TierEmblem } from "@/components/tier/drawing/tier-emblem";
import { DIVISION_NUMERALS, TIER_COLORS, TIER_NAMES } from "@/components/tier/tier";

// The Divisions of every Tier but Maniac, from the lowest to the highest: « IV à I ».
const DIVISION_SPAN = `${DIVISION_NUMERALS[4]} à ${DIVISION_NUMERALS[1]}`;

type TierLegendRowProps = { tier: Tier; mine: boolean };

// A Tier of the legend: its Emblem, its name and its Divisions, or « ton Tier » for the reader's.
export const TierLegendRow = ({ tier, mine }: TierLegendRowProps) => (
  <li
    aria-current={mine ? "true" : undefined}
    className={cn("flex h-9.5 items-center gap-3 px-2", mine ? "rounded-xl bg-surface-2" : null)}
  >
    <span className="size-5">
      <TierEmblem tier={tier} />
    </span>
    <span className={cn("flex-1 text-sm", mine ? "font-bold" : "font-semibold")}>
      {TIER_NAMES[tier]}
    </span>
    {mine ? (
      <span className={cn("text-xs font-semibold", TIER_COLORS[tier])}>ton Tier</span>
    ) : (
      <span className="text-xs text-muted-foreground">
        {tier === "maniac" ? "sans Division" : DIVISION_SPAN}
      </span>
    )}
  </li>
);

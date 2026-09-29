import { cn } from "cn";
import type { Tier } from "ranked";

import { TierEmblem } from "@/components/tier/drawing/tier-emblem";
import { DIVISION_NUMERALS, TIER_COLORS, TIER_NAMES } from "@/components/tier/tier";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type TierLegendRowProps = { tier: Tier; mine: boolean };

// A Tier of the legend: its Emblem, its name and its Divisions, or « ton Tier » for the reader's.
export const TierLegendRow = ({ tier, mine }: TierLegendRowProps) => {
  const locale = useLocale();

  return (
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
        <span className={cn("text-xs font-semibold", TIER_COLORS[tier])}>
          {m.leaderboard_tier_yours({}, { locale })}
        </span>
      ) : (
        // Maniac has no Division; every other Tier's, from the lowest to the highest: « IV à I ».
        <span className="text-xs text-muted-foreground">
          {tier === "maniac"
            ? m.leaderboard_tier_no_division({}, { locale })
            : m.leaderboard_tier_divisions(
                { lowest: DIVISION_NUMERALS[4], highest: DIVISION_NUMERALS[1] },
                { locale },
              )}
        </span>
      )}
    </li>
  );
};

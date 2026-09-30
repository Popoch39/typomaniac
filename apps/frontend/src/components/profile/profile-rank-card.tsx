import { cn } from "cn";
import type { Rank } from "ranked";

import { profileRankView } from "@/components/profile/profile-rank-view";
import { TierEmblem } from "@/components/tier/drawing/tier-emblem";
import { TpProgress } from "@/components/tier/rank/tp-progress";
import { TIER_COLORS } from "@/components/tier/tier";
import { useLocale } from "@/locale/use-locale";

// The rank in a Profile's header, the only place the page shows it, on its own card: its Tier's
// Emblem (none in Placement), its name in its Tier's colour and its TP out of 100, its bar (or a
// notch per Placement Duel), then how far the next rank. Nothing without a Rating.
export const ProfileRankCard = ({ rank }: { rank: Rank | null }) => {
  const locale = useLocale();
  const view = profileRankView(rank, locale);

  if (view === null) {
    return null;
  }

  const color = view.tier === null ? undefined : TIER_COLORS[view.tier];

  // Positioned: drawn over the avatar's Ornament where it overflows, never under it.
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center gap-4 rounded-[24px] bg-card py-3.5 pr-5.5",
        view.tier === null ? "pl-5.5" : "pl-4",
      )}
    >
      {view.tier === null ? null : (
        <span aria-hidden className={cn("size-13 shrink-0", color)}>
          <TierEmblem tier={view.tier} />
        </span>
      )}
      <div className="flex min-w-47 flex-col gap-1.75">
        <div className="flex items-baseline justify-between gap-3">
          <span className={cn("text-[21px] leading-tight font-extrabold", color)}>{view.name}</span>
          <span className="font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {view.figure}
          </span>
        </div>
        <TpProgress rank={rank} size="md" />
        {view.line === null ? null : (
          <span className="text-xs text-muted-foreground">{view.line}</span>
        )}
      </div>
    </div>
  );
};

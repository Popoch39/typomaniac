import { cn } from "cn";

import type { PromotionDuel } from "@/components/face-off/promotion-duel";
import { standingName, TIER_COLORS } from "@/components/tier/tier";
import { TierEmblem } from "@/components/tier/tier-emblem";

type FaceOffPromotionBannerProps = { promotion: PromotionDuel };

// The banner of a Promotion Duel, at the top, astride the diagonal: its title and the move a win
// makes, in the colour of the rank it reaches, whose emblem pulses. The timeline brings it down
// with the reveal and takes it out at GO.
export const FaceOffPromotionBanner = ({ promotion }: FaceOffPromotionBannerProps) => (
  <div
    data-face-off="banner"
    className="invisible absolute inset-x-0 top-14 flex justify-center opacity-0"
  >
    <p
      className={cn(
        "flex items-center gap-3.5 rounded-full bg-background py-3 pr-5.5 pl-3.5 shadow-[0_18px_50px_-10px_currentColor] ring-2 ring-current",
        TIER_COLORS[promotion.to.tier],
      )}
    >
      {/* The move says the rank already: the emblem is only seen. */}
      <span aria-hidden data-face-off="banner-emblem" className="size-8">
        <TierEmblem tier={promotion.to.tier} />
      </span>
      <span className="text-[0.9375rem] font-extrabold tracking-[0.14em] uppercase">
        {promotion.title}
      </span>
      {/* Keeps the title and the move apart for screen readers: the separator is only seen. */}{" "}
      <span aria-hidden className="h-5 w-px bg-foreground/15" />
      <span className="font-mono text-sm font-semibold text-foreground">
        {standingName(promotion.from)} → {standingName(promotion.to)}
      </span>
    </p>
  </div>
);

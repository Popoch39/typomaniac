import { cn } from "cn";
import type { Tier } from "ranked";

import { DIGITS, digitName } from "@/components/face-off/face-off-timeline";
import { TIER_COLORS } from "@/components/tier/tier";

const MARK =
  "invisible absolute inset-0 flex items-center justify-center leading-none text-foreground opacity-0";

type FaceOffCountProps = {
  // The Tier a win reaches in a Promotion Duel: the disc glows in its colour. Null otherwise.
  glowTier: Tier | null;
};

// The ink disc on the diagonal's middle, over both panels: the VS of the impact, then the 3-2-1
// and GO, each shown in turn by the timeline. Seen only: the announcer says them. Ringed with
// light for a Promotion Duel, for as long as it shows.
export const FaceOffCount = ({ glowTier }: FaceOffCountProps) => (
  <div
    aria-hidden
    data-face-off="disc"
    className={cn(
      "pointer-events-none invisible absolute inset-0 m-auto size-50 rounded-full bg-background opacity-0",
      glowTier === null ? "ring-12 ring-background/25" : null,
    )}
  >
    {glowTier === null ? null : (
      <span
        data-face-off="ring"
        className={cn(
          "absolute inset-0 rounded-full shadow-[0_0_0_6px_var(--color-background),0_0_0_14px_currentColor,0_0_90px_16px_currentColor]",
          TIER_COLORS[glowTier],
        )}
      />
    )}
    <span data-face-off="vs" className={cn(MARK, "text-[4rem] font-extrabold italic")}>
      VS
    </span>
    {DIGITS.map(({ mark }) => (
      <span
        key={mark}
        data-face-off={digitName(mark)}
        className={cn(MARK, "font-mono text-[6.875rem] font-semibold tabular-nums")}
      >
        {mark}
      </span>
    ))}
    <span
      data-face-off="go"
      className={cn(MARK, "text-[4.75rem] font-extrabold text-caret italic")}
    >
      GO
    </span>
  </div>
);

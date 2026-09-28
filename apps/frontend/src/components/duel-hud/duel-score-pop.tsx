import { cn } from "cn";
import { useRef } from "react";

import { popTimeline } from "@/components/duel-hud/band-effect-timelines";
import type { ScorePop } from "@/components/duel-hud/band-effects";
import { useCueTimeline } from "@/components/duel-hud/use-cue-timeline";

type DuelScorePopProps = {
  pop: ScorePop;
  startsAt: number;
  // The opponent's, on the Score's left.
  mirrored: boolean;
};

// The « +N » a right word brings, by its player's Score: it rises and fades on the Duel's clock,
// bigger for a Burst. Only fades in and out under reduced motion.
export const DuelScorePop = ({ pop, startsAt, mirrored }: DuelScorePopProps) => {
  const popRef = useRef<HTMLSpanElement>(null);

  useCueTimeline(popRef, { at: pop.at, startsAt }, (reducedMotion) =>
    popRef.current === null ? null : popTimeline(popRef.current, { rise: !reducedMotion }),
  );

  return (
    <span
      ref={popRef}
      aria-hidden="true"
      className={cn(
        "absolute -top-1 font-display font-bold tracking-[-0.02em] whitespace-nowrap opacity-0",
        mirrored ? "right-full mr-2" : "left-full ml-2",
        pop.burst ? "text-[15px]" : "text-[12px]",
      )}
    >
      +{pop.points}
    </span>
  );
};

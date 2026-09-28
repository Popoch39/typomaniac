import { useRef } from "react";

import { multiplierPunchTimeline } from "@/components/duel-hud/band-effect-timelines";
import { useCueTimeline } from "@/components/duel-hud/use-cue-timeline";

type DuelMultiplierProps = {
  multiplier: number;
  // When the Combo last went up a step, in ms since GO, while its punch plays; null otherwise.
  punchAt: number | null;
  startsAt: number;
};

// A player's multiplier in the band, punched each time their Combo goes up a step, on the Duel's
// clock; still under reduced motion.
export const DuelMultiplier = ({ multiplier, punchAt, startsAt }: DuelMultiplierProps) => {
  const multiplierRef = useRef<HTMLSpanElement>(null);

  useCueTimeline(multiplierRef, { at: punchAt, startsAt }, (reducedMotion) =>
    reducedMotion || multiplierRef.current === null
      ? null
      : multiplierPunchTimeline(multiplierRef.current),
  );

  return (
    <span
      ref={multiplierRef}
      className="inline-block font-display text-[20px] leading-none font-extrabold"
    >
      <span className="sr-only">multiplicateur </span>×{multiplier}
    </span>
  );
};

import { cn } from "cn";
import { useRef } from "react";

import { pipPunchTimeline } from "@/components/duel-hud/band-effect-timelines";
import { useCueTimeline } from "@/components/duel-hud/use-cue-timeline";
import { pipTone, usePipTone } from "@/components/duel-hud/use-pip-tone";

type DuelComboPipProps = {
  lit: boolean;
  // The opponent's, slanted the other way.
  mirrored: boolean;
  // When the right word that lit this pip came, in ms since GO, while its punch plays; null
  // otherwise, and for every pip but the last one lit.
  punchAt: number | null;
  // While a broken Combo turns the gauge red: the ink fades away under it, and back after.
  broken: boolean;
  startsAt: number;
};

// One pip of a Combo gauge, as its board draws it: slanted, in ink when lit and faint otherwise,
// its colour changing in 160 ms. The last one lit punches; red, fading, when the Combo breaks.
export const DuelComboPip = ({ lit, mirrored, punchAt, broken, startsAt }: DuelComboPipProps) => {
  const pipRef = useRef<HTMLSpanElement>(null);
  const inkRef = useRef<HTMLSpanElement>(null);
  const tone = pipTone({ lit, broken });

  usePipTone(inkRef, tone);
  useCueTimeline(pipRef, { at: punchAt, startsAt }, (reducedMotion) =>
    reducedMotion || pipRef.current === null ? null : pipPunchTimeline(pipRef.current),
  );

  return (
    <span
      ref={pipRef}
      aria-hidden="true"
      className={cn(
        "relative block h-4 w-2 shrink-0",
        mirrored
          ? "[transform:skewX(16deg)_scale(var(--punch,1))]"
          : "[transform:skewX(-16deg)_scale(var(--punch,1))]",
      )}
    >
      <span
        ref={inkRef}
        style={{ opacity: tone }}
        className="absolute inset-0 rounded-[2px] bg-ink"
      />
      {broken ? (
        <span
          data-combo-broken
          className="absolute inset-0 rounded-[2px] bg-destructive opacity-0"
        />
      ) : null}
    </span>
  );
};

import { cn } from "cn";
import { useRef } from "react";

import { calloutTimeline } from "@/components/duel-hud/callout-timeline";
import type { Callout, CalloutTone } from "@/components/duel-hud/callouts";
import { useCueTimeline } from "@/components/duel-hud/use-cue-timeline";

// Each pill in its colour, under the ink the Theme lays on it; the red reads under the ground's
// ink in every Theme, as the ground's text reads on it.
const TONES: Record<CalloutTone, string> = {
  self: "bg-brand text-on-brand",
  opponent: "bg-opponent text-on-opponent",
  broken: "bg-destructive text-ink",
};

type DuelCalloutProps = {
  callout: Callout;
  // GO on the Duel's clock.
  startsAt: number;
};

// One Callout, as the board draws it: a tilted pill in its colour, the words in its ink, then the
// figures. It punches in, holds and fades out on the Duel's clock; only fades under reduced motion.
export const DuelCallout = ({ callout, startsAt }: DuelCalloutProps) => {
  const calloutRef = useRef<HTMLSpanElement>(null);

  useCueTimeline(calloutRef, { at: callout.at, startsAt }, (reducedMotion) =>
    calloutRef.current === null
      ? null
      : calloutTimeline(calloutRef.current, { lasts: callout.lasts, punch: !reducedMotion }),
  );

  return (
    <span
      ref={calloutRef}
      className={cn(
        "inline-flex items-baseline gap-2.5 rounded-full font-display font-extrabold whitespace-nowrap opacity-0 [transform:rotate(-2deg)_scale(var(--punch,1))]",
        // The line height after the size: a size set later would drop it.
        callout.small
          ? "px-3.5 py-2 text-[12px] leading-none"
          : "px-[18px] py-2.5 text-[16px] leading-none",
        TONES[callout.tone],
      )}
    >
      <span>{callout.text}</span>{" "}
      <span
        className={cn(
          "font-bold tracking-[-0.02em]",
          callout.small ? "text-[10px]" : "text-[13px]",
        )}
      >
        {callout.value}
      </span>
    </span>
  );
};

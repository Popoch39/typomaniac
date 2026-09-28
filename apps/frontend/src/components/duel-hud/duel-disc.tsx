import { cn } from "cn";
import { useRef } from "react";

import { discLead, leaderOf } from "@/components/duel-hud/band-lead";
import { RING_LENGTH, URGENT_S } from "@/components/duel-hud/disc-timeline";
import { useDiscTimeline } from "@/components/duel-hud/use-disc-timeline";

const LEAD_TONES = {
  self: "text-brand",
  opponent: "text-opponent",
  none: "text-muted-foreground",
} as const;

type DuelDiscProps = {
  // GO, on the tab's clock.
  startsAt: number;
  seconds: number;
  // Ms since GO, negative during the Countdown.
  elapsed: number;
  // The time is up.
  over: boolean;
  lead: number;
};

// The ink disc in the middle of the band: the seconds left inside a ring that empties over the
// time, the Lead under them in the leader's colour. Red in the last seconds, when it beats. Once
// the time is up, FIN in place of the seconds, back in white, and only the ring stays red.
export const DuelDisc = ({ startsAt, seconds, elapsed, over, lead }: DuelDiscProps) => {
  const discRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const left = Math.max(0, Math.ceil(seconds - Math.max(0, elapsed) / 1000));
  const urgent = !over && elapsed >= (seconds - URGENT_S) * 1000;

  useDiscTimeline({ disc: discRef, ring: ringRef }, { startsAt, seconds });

  return (
    <div
      ref={discRef}
      className="absolute top-1/2 left-1/2 -mt-[42px] -ml-[42px] flex size-[84px] flex-col items-center justify-center gap-px rounded-full bg-ink ring-6 ring-ink/25"
    >
      <svg
        width="84"
        height="84"
        viewBox="0 0 84 84"
        aria-hidden="true"
        className="absolute top-0 left-0 -rotate-90"
      >
        <circle
          cx="42"
          cy="42"
          r="38"
          fill="none"
          strokeWidth="3"
          className="stroke-foreground/12"
        />
        <circle
          ref={ringRef}
          cx="42"
          cy="42"
          r="38"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${RING_LENGTH} ${RING_LENGTH}`}
          className={urgent || over ? "stroke-destructive" : "stroke-foreground"}
        />
      </svg>
      <span
        role="timer"
        aria-label="temps restant"
        className={cn(
          "relative font-display leading-none",
          over ? "text-[15px] font-extrabold" : "text-[26px] font-bold tracking-[-0.02em]",
          urgent ? "text-destructive" : "text-foreground",
        )}
      >
        {over ? "FIN" : left}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative font-display text-[10px] leading-none font-bold tracking-[-0.02em]",
          LEAD_TONES[leaderOf(lead)],
        )}
      >
        {discLead(lead)}
      </span>
    </div>
  );
};

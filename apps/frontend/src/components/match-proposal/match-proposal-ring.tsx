import { cn } from "cn";

import {
  ALERT_SECONDS,
  isCancelled,
  PROPOSAL_SECONDS,
} from "@/components/match-proposal/match-proposal-copy";
import type { ProposalStage } from "@/stores/duel-store";

type MatchProposalRingProps = { stage: ProposalStage; secondsLeft: number };

const RADIUS = 58;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// The count at the centre and the word under it.
const countOf = (stage: ProposalStage, secondsLeft: number) => {
  if (stage === "ready") {
    return { count: "GO", unit: "Face-off" };
  }

  return isCancelled(stage)
    ? { count: "–", unit: "annulé" }
    : { count: String(secondsLeft), unit: "secondes" };
};

// Between the two players: the time left to answer as a ring that empties, in the alert colour
// in the last seconds; full and green once both accepted, empty once it ended without a Duel.
export const MatchProposalRing = ({ stage, secondsLeft }: MatchProposalRingProps) => {
  const ready = stage === "ready";
  const cancelled = isCancelled(stage);
  const alert = !ready && !cancelled && secondsLeft <= ALERT_SECONDS;
  const filled = ready ? 1 : cancelled ? 0 : secondsLeft / PROPOSAL_SECONDS;
  const { count, unit } = countOf(stage, secondsLeft);

  return (
    <div
      data-alert={alert}
      className="relative flex size-33 items-center justify-center"
      aria-hidden
    >
      <svg viewBox="0 0 132 132" className="absolute inset-0 size-full -rotate-90">
        <circle cx="66" cy="66" r={RADIUS} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="66"
          cy="66"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
          className={cn(
            "transition-[stroke-dashoffset,stroke] duration-1000 ease-linear",
            ready ? "stroke-win" : alert ? "stroke-destructive" : "stroke-primary",
          )}
        />
      </svg>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "font-mono text-[2.5rem] leading-none font-bold tabular-nums",
            ready ? "text-win" : alert ? "text-destructive" : "text-foreground",
          )}
        >
          {count}
        </span>
        <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {unit}
        </span>
      </div>
    </div>
  );
};

import { cn } from "cn";

import { ALERT_SECONDS, PROPOSAL_SECONDS } from "@/components/match-proposal/match-proposal-copy";
import type { ProposalStage } from "@/stores/duel-store";

type MatchProposalRingProps = { stage: ProposalStage; secondsLeft: number };

const RADIUS = 58;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// The count at the centre and the word under it.
const countOf = (stage: ProposalStage, secondsLeft: number) => {
  switch (stage) {
    case "ready":
      return { count: "GO", unit: "Face-off" };
    case "missed":
      return { count: "–", unit: "annulé" };
    case "pending":
    case "accepted":
      return { count: String(secondsLeft), unit: "secondes" };
  }
};

// Between the two players: the time left to answer as a ring that empties, in the alert colour
// in the last seconds; full and green once both accepted, empty once the time ran out.
export const MatchProposalRing = ({ stage, secondsLeft }: MatchProposalRingProps) => {
  const ready = stage === "ready";
  const alert = !ready && stage !== "missed" && secondsLeft <= ALERT_SECONDS;
  const filled = ready ? 1 : stage === "missed" ? 0 : secondsLeft / PROPOSAL_SECONDS;
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

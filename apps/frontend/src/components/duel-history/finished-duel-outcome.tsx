import { outcomeHeadlines } from "@/components/duel/outcome-headlines";
import { cn } from "cn";

type FinishedDuelOutcomeProps = {
  outcome: keyof typeof outcomeHeadlines;
  forfeit: boolean;
  className?: string;
};

// How a finished Duel ended for the User, in a few words: in the Duel history and atop its Replay.
export const FinishedDuelOutcome = ({ outcome, forfeit, className }: FinishedDuelOutcomeProps) => (
  <span className={cn("font-bold", outcome === "win" && "text-primary", className)}>
    {outcomeHeadlines[outcome]}
    {forfeit ? " par Forfeit" : null}
  </span>
);

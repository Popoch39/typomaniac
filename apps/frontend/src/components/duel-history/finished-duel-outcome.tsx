import type { DuelOutcome } from "api";

import { outcomeHeadline } from "@/components/duel/outcome-headlines";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

type FinishedDuelOutcomeProps = {
  outcome: DuelOutcome;
  forfeit: boolean;
  className?: string;
};

// How a finished Duel ended for the User, in a few words: in the Duel history and atop its Replay.
export const FinishedDuelOutcome = ({ outcome, forfeit, className }: FinishedDuelOutcomeProps) => {
  const locale = useLocale();
  const headline = outcomeHeadline(outcome, locale);

  return (
    <span className={cn("font-bold", outcome === "win" && "text-primary", className)}>
      {forfeit ? m.outcome_by_forfeit({ outcome: headline }, { locale }) : headline}
    </span>
  );
};

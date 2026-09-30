import { cn } from "cn";

import { OUTCOME_PAINT, type Outcome } from "@/components/profile/profile-card-paint";
import { profileFigure } from "@/components/profile/profile-figure";
import { useLocale } from "@/locale/use-locale";

type OutcomeCountProps = { outcome: Outcome; term: string; count: number };

// One line of the win rate's legend: its colour on the bar before its name, then how many. The
// losses' swatch is ringed: its colour alone would sink into the card.
export const OutcomeCount = ({ outcome, term, count }: OutcomeCountProps) => {
  const locale = useLocale();

  return (
    <div className="flex items-center gap-2.5">
      <dt className="flex flex-1 items-center gap-2.5 text-muted-foreground">
        <span
          aria-hidden
          className={cn(
            "size-2.5 shrink-0 rounded-[3px]",
            OUTCOME_PAINT[outcome],
            outcome === "losses" && "border-2 border-faint",
          )}
        />
        {term}
      </dt>
      <dd className="font-mono font-bold tabular-nums">{profileFigure(count, locale)}</dd>
    </div>
  );
};

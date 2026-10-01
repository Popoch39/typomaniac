import { cn } from "cn";

import { outcomeHeadline } from "@/components/duel/outcome-headlines";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { DuelEnding } from "@/stores/duel-store";

const details = {
  win: m.duel_ended_win,
  loss: m.duel_ended_loss,
  draw: m.duel_ended_draw,
};

// A Forfeit is never a Draw: one side forfeited, the other won. It never changes the headline,
// kept huge and short: the detail says it.
const forfeitDetails = {
  win: m.duel_ended_forfeit_win,
  loss: m.duel_ended_forfeit_loss,
  draw: details.draw,
};

// A win in the accent, to savour it; a loss or a Draw in the text's colour.
const HEADLINE_TONES = { win: "text-brand", loss: "text-foreground", draw: "text-foreground" };

type DuelEndOutcomeProps = Pick<DuelEnding, "outcome" | "forfeit"> & {
  opponent: string;
  // A Bo3's screen, which holds without scrolling: smaller.
  compact?: boolean;
};

// Who won the Duel, from this User's side, huge, with the sentence that names the opponent.
export const DuelEndOutcome = ({
  outcome,
  forfeit,
  opponent,
  compact = false,
}: DuelEndOutcomeProps) => {
  const locale = useLocale();

  return (
    <div data-entrance="outcome" className="flex items-end justify-between gap-6">
      <h2
        className={cn(
          "font-display leading-[0.9] font-black tracking-[-0.03em] uppercase",
          compact ? "text-[64px]" : "text-[104px]",
          HEADLINE_TONES[outcome],
        )}
      >
        {outcomeHeadline(outcome, locale)}
      </h2>
      <p
        className={cn(
          "font-semibold text-muted-foreground",
          compact ? "mb-1 text-lg" : "mb-2 text-xl",
        )}
      >
        {(forfeit ? forfeitDetails : details)[outcome]({ opponent }, { locale })}
      </p>
    </div>
  );
};

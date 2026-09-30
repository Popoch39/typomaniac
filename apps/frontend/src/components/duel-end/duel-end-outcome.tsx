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

type DuelEndOutcomeProps = Pick<DuelEnding, "outcome" | "forfeit"> & { opponent: string };

// Who won the Duel, from this User's side, huge, with the sentence that names the opponent.
export const DuelEndOutcome = ({ outcome, forfeit, opponent }: DuelEndOutcomeProps) => {
  const locale = useLocale();

  return (
    <div className="flex items-end justify-between gap-6">
      <h2
        className={cn(
          "font-display text-[104px] leading-[0.9] font-black tracking-[-0.03em] uppercase",
          HEADLINE_TONES[outcome],
        )}
      >
        {outcomeHeadline(outcome, locale)}
      </h2>
      <p className="mb-2 text-xl font-semibold text-muted-foreground">
        {(forfeit ? forfeitDetails : details)[outcome]({ opponent }, { locale })}
      </p>
    </div>
  );
};

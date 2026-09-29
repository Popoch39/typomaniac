import { outcomeHeadline } from "@/components/duel/outcome-headlines";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { DuelEnding } from "@/stores/duel-store";
import { cn } from "cn";

const details = {
  win: m.duel_ended_win,
  loss: m.duel_ended_loss,
  draw: m.duel_ended_draw,
};

// A Forfeit is never a Draw: one side forfeited, the other won.
const forfeitDetails = {
  win: m.duel_ended_forfeit_win,
  loss: m.duel_ended_forfeit_loss,
  draw: details.draw,
};

type DuelOutcomeProps = Pick<DuelEnding, "outcome" | "forfeit"> & { opponent: string };

// A win fills the card with the accent, to savour it; a loss or a Draw stays sober.
const victory = {
  card: "bg-primary text-primary-foreground",
  detail: "text-primary-foreground/80",
};

const sober = { card: "bg-card", detail: "text-muted-foreground" };

const tones = { win: victory, loss: sober, draw: sober };

// Who won the Duel, from this User's side, and whether by Forfeit.
export const DuelOutcome = ({ outcome, forfeit, opponent }: DuelOutcomeProps) => {
  const locale = useLocale();

  return (
    <div className={cn("flex flex-col gap-1 rounded-card p-8", tones[outcome].card)}>
      <h2 className="text-5xl font-extrabold tracking-tight">{outcomeHeadline(outcome, locale)}</h2>
      <p className={cn("text-lg font-medium", tones[outcome].detail)}>
        {(forfeit ? forfeitDetails : details)[outcome]({ opponent }, { locale })}
      </p>
    </div>
  );
};

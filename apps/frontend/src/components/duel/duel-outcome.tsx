import { outcomeHeadlines } from "@/components/duel/outcome-headlines";
import type { DuelEnding } from "@/stores/duel-store";
import { cn } from "cn";

const details = {
  win: (opponent: string) => `Tu bats ${opponent}.`,
  loss: (opponent: string) => `${opponent} l'emporte.`,
  draw: (opponent: string) => `Ni toi ni ${opponent} ne l'emportez.`,
};

// A Forfeit is never a Draw: one side forfeited, the other won.
const forfeitDetails = {
  win: (opponent: string) => `Forfeit de ${opponent}.`,
  loss: (opponent: string) => `Forfeit : ${opponent} l'emporte.`,
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
export const DuelOutcome = ({ outcome, forfeit, opponent }: DuelOutcomeProps) => (
  <div className={cn("flex flex-col gap-1 rounded-card p-8", tones[outcome].card)}>
    <h2 className="text-5xl font-extrabold tracking-tight">{outcomeHeadlines[outcome]}</h2>
    <p className={cn("text-lg font-medium", tones[outcome].detail)}>
      {(forfeit ? forfeitDetails : details)[outcome](opponent)}
    </p>
  </div>
);

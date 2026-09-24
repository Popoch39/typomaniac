import { outcomeHeadlines } from "@/components/duel/outcome-headlines";
import type { DuelEnding } from "@/stores/duel-store";

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

// Who won the Duel, from this User's side, and whether by Forfeit.
export const DuelOutcome = ({ outcome, forfeit, opponent }: DuelOutcomeProps) => (
  <div className="flex flex-col gap-1">
    <h2 className="text-5xl font-bold">{outcomeHeadlines[outcome]}</h2>
    <p className="text-lg text-muted-foreground">
      {(forfeit ? forfeitDetails : details)[outcome](opponent)}
    </p>
  </div>
);

import type { DuelEnding } from "@/stores/duel-store";

const headlines = {
  win: "Victoire",
  loss: "Défaite",
  draw: "Draw",
};

const details = {
  win: (opponent: string) => `Tu bats ${opponent}.`,
  loss: (opponent: string) => `${opponent} l'emporte.`,
  draw: (opponent: string) => `Ni toi ni ${opponent} ne l'emportez.`,
};

type DuelOutcomeProps = { outcome: DuelEnding["outcome"]; opponent: string };

// Who won the Duel, from this User's side.
export const DuelOutcome = ({ outcome, opponent }: DuelOutcomeProps) => (
  <div className="flex flex-col gap-1">
    <h2 className="text-5xl font-bold">{headlines[outcome]}</h2>
    <p className="text-lg text-muted-foreground">{details[outcome](opponent)}</p>
  </div>
);

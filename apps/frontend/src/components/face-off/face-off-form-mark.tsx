import type { DuelOutcome } from "api";
import { cn } from "cn";
import { Check, Minus, X } from "lucide-react";

// A won Duel checked in green, a lost one crossed in red, a Draw a neutral dash: told apart by
// their shape as much as their colour, and named for screen readers.
const MARKS = {
  win: { Icon: Check, color: "text-win", name: "Victoire" },
  loss: { Icon: X, color: "text-destructive", name: "Défaite" },
  draw: { Icon: Minus, color: "text-muted-foreground", name: "Draw" },
} as const;

type FaceOffFormMarkProps = { outcome: DuelOutcome };

// One Ranked Duel of the Form, on a small ink square: green and red would not read right on the
// player's colour.
export const FaceOffFormMark = ({ outcome }: FaceOffFormMarkProps) => {
  const { Icon, color, name } = MARKS[outcome];

  return (
    <li
      data-face-off="form-item"
      className={cn("flex size-7 items-center justify-center rounded-lg bg-background", color)}
    >
      <Icon aria-hidden className="size-4" strokeWidth={3.5} />
      <span className="sr-only">{name}</span>
    </li>
  );
};

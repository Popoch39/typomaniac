import { cn } from "cn";

import type { DuelVerdict } from "@/components/duel-hud/duel-hud-model";

// What the pill says of each outcome, the sign of the gap, and its colour under the ink the Theme
// lays on it (a draw's in the text's colour, under the ground's).
const VERDICT_LOOKS = {
  win: { text: "VICTOIRE", sign: "+", tone: "bg-brand text-on-brand" },
  loss: { text: "DÉFAITE", sign: "−", tone: "bg-opponent text-on-opponent" },
  draw: { text: "DRAW", sign: "", tone: "bg-foreground text-ink" },
} as const;

// The server's verdict where the Callouts go, as the board draws it once the time is up: a big
// tilted pill in the winner's colour, white for a draw, then the gap between the server's Scores,
// none when they are equal. Still: it stays until the end screen.
export const DuelVerdictCallout = ({ verdict }: { verdict: DuelVerdict }) => {
  const { text, sign, tone } = VERDICT_LOOKS[verdict.outcome];

  return (
    <span
      className={cn(
        "inline-flex rotate-[-2deg] items-baseline gap-2.5 rounded-full px-[18px] py-2.5 font-display text-[21px] leading-none font-extrabold whitespace-nowrap",
        tone,
      )}
    >
      <span>{text}</span>{" "}
      {verdict.lead === 0 ? null : (
        <span className="text-[13px] font-bold tracking-[-0.02em]">
          {sign}
          {Math.abs(verdict.lead)}
        </span>
      )}
    </span>
  );
};

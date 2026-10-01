import { cn } from "cn";

import { duelNumber } from "@/components/duel-history/duel-number";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { PlayedRound } from "@/stores/duel-store";

// The winner's pill, in their colour; a drawn Round's, neutral.
const WINNER_PAINT = {
  win: "bg-brand text-on-brand",
  loss: "bg-opponent text-on-opponent",
  draw: "bg-surface-2 text-muted-foreground",
} as const;

type DuelEndRoundLineProps = { round: PlayedRound; opponent: string };

// One Round of the series: its number, both Scores (the winner's in their colour, the other's
// grey), and who took it, or « Manche nulle ».
export const DuelEndRoundLine = ({ round, opponent }: DuelEndRoundLineProps) => {
  const locale = useLocale();
  const { outcome } = round;

  const winner = {
    win: m.duel_self({}, { locale }),
    loss: opponent,
    draw: m.round_break_drawn({}, { locale }),
  }[outcome];

  return (
    <li
      data-round-line
      data-outcome={outcome}
      className="grid grid-cols-[1fr_140px_140px_1fr] items-center gap-4 rounded-2xl bg-surface-2/50 px-5 py-2.5"
    >
      <span className="font-display text-sm font-extrabold tracking-[0.04em] uppercase">
        {m.round_break_round_n({ n: round.index + 1 }, { locale })}
      </span>
      <span
        className={cn(
          "text-right font-display text-2xl font-black",
          outcome === "win" ? "text-brand" : "text-muted-foreground",
        )}
      >
        {duelNumber(round.score.score, locale)}
      </span>
      <span
        className={cn(
          "font-display text-2xl font-black",
          outcome === "loss" ? "text-opponent" : "text-muted-foreground",
        )}
      >
        {duelNumber(round.opponentScore.score, locale)}
      </span>
      <span
        className={cn(
          "justify-self-end rounded-full px-3 py-1 text-sm font-bold",
          WINNER_PAINT[outcome],
        )}
      >
        {winner}
      </span>
    </li>
  );
};

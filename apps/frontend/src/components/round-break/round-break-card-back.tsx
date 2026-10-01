import { cn } from "cn";

import { duelNumber } from "@/components/duel-history/duel-number";
import type { PlayedCard } from "@/components/round-break/round-break-view";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Each winner's colour on the card, and the ink over it; neutral for a drawn Round.
const PAINT = {
  self: "bg-brand text-on-brand",
  opponent: "bg-opponent text-on-opponent",
  draw: "bg-surface-2 text-foreground",
} as const;

type RoundBreakCardBackProps = {
  index: number;
  played: PlayedCard;
  opponentHandle: string;
};

// The face of a played Round's card, in its winner's colour: who takes it, their Score, « contre »
// the other's and the gap. A drawn Round: « Manche nulle », both Scores, no gap.
export const RoundBreakCardBack = ({ index, played, opponentHandle }: RoundBreakCardBackProps) => {
  const locale = useLocale();
  const { winner, top, bottom, gap } = played;

  return (
    <div
      data-rb="back"
      className={cn(
        "absolute inset-0 flex rotate-y-180 flex-col justify-between rounded-card p-7 backface-hidden",
        PAINT[winner],
      )}
    >
      <div className="text-sm font-bold tracking-[0.24em] uppercase opacity-70">
        {m.round_break_round_n({ n: index + 1 }, { locale })}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="font-display text-[40px] leading-none font-black">
          {winner === "draw"
            ? m.round_break_drawn({}, { locale })
            : winner === "self"
              ? m.duel_self({}, { locale })
              : atHandle(opponentHandle)}
        </div>
        {winner === "draw" ? null : (
          <div className="text-lg font-bold">{m.round_break_takes_it({}, { locale })}</div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="font-display text-[52px] leading-none font-black tracking-[-0.02em]">
          {duelNumber(top, locale)}
        </div>
        <div className="flex items-center justify-between font-text text-[17px] font-extrabold">
          <span>{m.round_break_against({ score: duelNumber(bottom, locale) }, { locale })}</span>
          {winner === "draw" ? null : (
            <span className="rounded-full bg-background px-2.5 py-1 text-foreground">
              +{duelNumber(gap, locale)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

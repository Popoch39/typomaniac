import { cn } from "cn";

import type { RoundCard } from "@/components/round-break/round-break-view";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

const FOOT_MESSAGES = {
  "to-play": m.round_break_to_play,
  deciding: m.round_break_deciding,
  "if-needed": m.round_break_if_needed,
} as const;

// The face of a Round's card before it is played: « Manche », its number in large, and what its
// foot says. The next Round's is lit: its number in the text's colour, its foot in the accent.
export const RoundBreakCardFront = ({ card }: { card: RoundCard }) => {
  const locale = useLocale();
  const next = card.state === "next";

  return (
    <div
      data-rb="front"
      className="absolute inset-0 flex flex-col justify-between rounded-card border-2 border-surface-2 bg-card p-7 backface-hidden"
    >
      <div className="text-sm font-bold tracking-[0.24em] text-muted-foreground uppercase">
        {m.round_break_round({}, { locale })}
      </div>
      <div
        data-rb="number"
        className={cn(
          "font-display text-[200px] leading-[0.8] font-black",
          next ? "text-foreground" : "text-surface-2",
        )}
      >
        {card.index + 1}
      </div>
      <div className={cn("font-text text-base font-extrabold", next ? "text-brand" : "text-faint")}>
        {card.foot === null ? null : FOOT_MESSAGES[card.foot]({}, { locale })}
      </div>
    </div>
  );
};

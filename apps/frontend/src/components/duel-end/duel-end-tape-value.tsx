import { cn } from "cn";

import { DuelEndTapeBest } from "@/components/duel-end/duel-end-tape-best";
import type { TapeBest, TapeSide } from "@/components/duel-end/tape-lines";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// In the player's colour when the value is the best of its line, or level with it; in grey when
// the other player did better.
const TONES = { mine: "text-brand", theirs: "text-opponent" };

type DuelEndTapeValueProps = {
  side: TapeSide;
  value: string;
  best: TapeBest;
  // The value beat this User's Record: tagged « Record », outermost.
  record: boolean;
};

// One player's value on a line, its mark between it and the line's name when it is the best.
export const DuelEndTapeValue = ({ side, value, best, record }: DuelEndTapeValueProps) => {
  const locale = useLocale();
  const mark = best === side ? <DuelEndTapeBest side={side} /> : null;

  return (
    <td>
      <div className={cn("flex items-center gap-3.5", side === "mine" && "justify-end")}>
        {record ? (
          <span className="rounded-[8px] bg-brand px-2.5 py-[5px] font-display text-[11px] font-extrabold tracking-[0.08em] text-on-brand uppercase">
            {m.duel_ended_record({}, { locale })}
          </span>
        ) : null}
        {side === "mine" ? mark : null}
        <span
          className={cn(
            "font-display text-[34px] font-extrabold tracking-[-0.02em]",
            best === side || best === "level" ? TONES[side] : "text-muted-foreground",
          )}
        >
          {value}
        </span>
        {side === "theirs" ? mark : null}
      </div>
    </td>
  );
};

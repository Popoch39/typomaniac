import type { RecentRankedDuel } from "@/api/recent-ranked-duels";
import { RowHandle } from "@/components/play/row-handle";
import { RowSentence } from "@/components/play/row-sentence";
import { relativeTime } from "@/lib/relative-time";
import { numberFormat } from "@/locale/formats";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type RecentTierDuelRowProps = { duel: RecentRankedDuel; now: number };

// A Ranked Duel just won, on one line: « @mia bat @noe · 104 – 97 · il y a 1 min ». Only a Handle
// long past the usual gives way, never the figures.
export const RecentTierDuelRow = ({ duel, now }: RecentTierDuelRowProps) => {
  const locale = useLocale();
  const wpm = (value: number) => numberFormat(locale).format(Math.round(value));

  return (
    <li className="gap-2 text-sm play-rows-slim:gap-1.5 play-rows-slim:text-xs">
      <RowSentence>
        {withSlots((marks) => m.play_ranked_duel(marks, { locale }), {
          winner: <RowHandle handle={duel.winner.handle} />,
          loser: <RowHandle handle={duel.loser.handle} />,
        })}
      </RowSentence>
      <span className="shrink-0 font-mono text-xs tabular-nums opacity-80">
        {m.play_duel_wpm(
          { winnerWpm: wpm(duel.winner.wpm), loserWpm: wpm(duel.loser.wpm) },
          { locale },
        )}
      </span>
      <time
        dateTime={new Date(duel.endedAt).toISOString()}
        className="ml-auto shrink-0 text-xs opacity-70"
      >
        {relativeTime(duel.endedAt, now, locale, "short")}
      </time>
    </li>
  );
};

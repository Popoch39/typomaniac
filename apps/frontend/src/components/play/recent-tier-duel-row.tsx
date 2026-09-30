import type { RecentRankedDuel } from "@/api/recent-ranked-duels";
import { atHandle } from "@/lib/at-handle";
import { relativeTime } from "@/lib/relative-time";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type RecentTierDuelRowProps = { duel: RecentRankedDuel; now: number };

// A Ranked Duel just won, on one line: « @mia bat @noe · 104 – 97 · il y a 1 min ». Only a Handle
// long past the usual gives way, never the figures.
export const RecentTierDuelRow = ({ duel, now }: RecentTierDuelRowProps) => {
  const locale = useLocale();
  const wpm = (value: number) => numberFormat(locale).format(Math.round(value));

  return (
    <li className="gap-2 text-sm">
      <span className="min-w-0 truncate font-semibold">
        {m.play_ranked_duel(
          { winner: atHandle(duel.winner.handle), loser: atHandle(duel.loser.handle) },
          { locale },
        )}
      </span>
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

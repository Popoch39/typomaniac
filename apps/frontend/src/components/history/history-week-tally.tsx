import { tpTone } from "@/components/duel-history/tp-tone";
import { HistoryTallyFigure } from "@/components/history/history-tally-figure";
import { signedFigure } from "@/components/history/history-text";
import { tallyOf } from "@/components/history/history-week";
import { useShownWeek } from "@/components/history/use-history-view";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The week shown, together: its Duels, its Victories and the TP it moved.
export const HistoryWeekTally = () => {
  const { duels } = useShownWeek();
  const locale = useLocale();
  const tally = tallyOf(duels);

  return (
    <dl className="m-0 grid grid-cols-3 gap-7">
      <HistoryTallyFigure
        term={m.history_tally_duels({}, { locale })}
        value={numberFormat(locale).format(tally.duels)}
      />
      <HistoryTallyFigure
        term={m.history_tally_wins({}, { locale })}
        value={numberFormat(locale).format(tally.wins)}
      />
      <HistoryTallyFigure
        term={m.history_tally_tp({}, { locale })}
        value={signedFigure(tally.tp, locale)}
        className={tpTone(tally.tp)}
      />
    </dl>
  );
};

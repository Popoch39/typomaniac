import type { ReplayedDuel } from "@/api/duel-history";
import { DuelChart } from "@/components/duel-chart/duel-chart";
import type { DuelAverage } from "@/components/replay/duel-result-lines";
import { DuelResultsTable } from "@/components/replay/duel-results-table";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

const CARD_PAINT = "flex min-w-0 flex-col gap-4 rounded-card bg-card px-6 pt-4.5 pb-5";

const TITLE_PAINT = "text-[15px] font-bold";

// Under the Replay, the whole Duel (or the Round of a Bo3 shown) at once: its chart second by
// second, and both sides' Results line by line beside it, a Bo3's with the Duel's average.
export const ReplayStats = ({
  duel,
  average,
}: {
  duel: ReplayedDuel;
  average: DuelAverage | null;
}) => {
  const locale = useLocale();
  const chartTitle = m.duel_chart_label({}, { locale });
  const resultsTitle = m.duel_results_label({}, { locale });

  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5">
      <section aria-label={chartTitle} className={CARD_PAINT}>
        <h2 className={TITLE_PAINT}>{chartTitle}</h2>
        <DuelChart duel={duel} />
      </section>
      <section aria-label={resultsTitle} className={CARD_PAINT}>
        <h2 className={TITLE_PAINT}>{resultsTitle}</h2>
        <DuelResultsTable duel={duel} average={average} />
      </section>
    </div>
  );
};

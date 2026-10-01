import { HistoryFriezeLegend } from "@/components/history/history-frieze-legend";
import { HistoryFriezeWeek } from "@/components/history/history-frieze-week";
import { friezeColumns } from "@/components/history/history-week";
import { HistoryWeekTally } from "@/components/history/history-week-tally";
import { useFriezeActivity, useHistoryView } from "@/components/history/use-history-view";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The 16 weeks of the User's Activity, a column of days each, the way to any of them; beside it,
// the tally of the week shown.
export const HistoryFrieze = () => {
  const { shown, current, friezeEnd, today } = useHistoryView();
  const { days } = useFriezeActivity();
  const locale = useLocale();
  const counts = new Map(days.map(({ day, duels }) => [day, duels]));

  return (
    <section
      aria-label={m.history_weeks_label({}, { locale })}
      className="flex flex-wrap items-center gap-10 rounded-card bg-card px-7 py-6"
    >
      <div className="flex min-w-0 grow flex-col gap-3.5">
        {/* One provider: from a day to the next, the tooltip follows at once. */}
        <TooltipProvider>
          <div className="flex items-end gap-1">
            {friezeColumns(friezeEnd, today, counts).map((column) => (
              <HistoryFriezeWeek
                key={column.week}
                column={column}
                shown={shown}
                current={current}
              />
            ))}
          </div>
        </TooltipProvider>
        <HistoryFriezeLegend />
      </div>
      <HistoryWeekTally />
    </section>
  );
};

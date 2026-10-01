import { Link } from "@tanstack/react-router";

import { HistoryFriezeDay } from "@/components/history/history-frieze-day";
import { shortDay } from "@/components/history/history-text";
import { type FriezeColumn, weekSearch, type WeekKey } from "@/components/history/history-week";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

type HistoryFriezeWeekProps = { column: FriezeColumn; shown: WeekKey; current: WeekKey };

// A week of the frieze, its seven days from Monday heated by their Duels: the way to that week,
// ringed when it is the one shown.
export const HistoryFriezeWeek = ({ column, shown, current }: HistoryFriezeWeekProps) => {
  const locale = useLocale();

  return (
    <Link
      to="/history"
      search={weekSearch(column.week, current)}
      aria-label={m.history_frieze_week({ date: shortDay(column.week, locale) }, { locale })}
      className={cn(
        "flex flex-col gap-1 rounded-[10px] border-2 p-1.25 outline-none hover:bg-surface-2 focus-visible:ring-3 focus-visible:ring-ring/50",
        column.week === shown ? "border-foreground" : "border-transparent",
      )}
    >
      {column.days.map((day) => (
        <HistoryFriezeDay key={day.day} {...day} />
      ))}
    </Link>
  );
};

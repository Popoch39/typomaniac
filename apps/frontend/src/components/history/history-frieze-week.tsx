import { Link } from "@tanstack/react-router";

import { HEAT_PAINT, FUTURE_DAY_PAINT } from "@/components/history/history-paint";
import { shortDay } from "@/components/history/history-text";
import {
  type FriezeColumn,
  heatLevel,
  weekSearch,
  type WeekKey,
} from "@/components/history/history-week";
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
      {column.days.map(({ day, duels, future }) => (
        <span
          key={day}
          className={cn(
            "size-3.5 rounded-[4px]",
            future ? FUTURE_DAY_PAINT : HEAT_PAINT[heatLevel(duels)],
          )}
        />
      ))}
    </Link>
  );
};

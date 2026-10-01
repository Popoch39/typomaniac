import { Link } from "@tanstack/react-router";

import { weekLabel } from "@/components/history/history-text";
import { nextWeekOf, previousWeekOf } from "@/components/history/history-week";
import { HistoryWeekStep } from "@/components/history/history-week-step";
import { useFriezeActivity, useHistoryView } from "@/components/history/use-history-view";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// From week to week: back to the week of the first Duel, on to the current one, and straight
// back to it.
export const HistoryWeekNav = () => {
  const { shown, current } = useHistoryView();
  const { first } = useFriezeActivity();
  const locale = useLocale();

  return (
    <nav aria-label={m.history_week_nav({}, { locale })} className="flex items-center gap-2">
      <HistoryWeekStep
        direction="previous"
        to={previousWeekOf(shown, first)}
        current={current}
        label={m.history_week_previous({}, { locale })}
      />
      <span className="min-w-47.5 text-center text-xl font-bold">{weekLabel(shown, locale)}</span>
      <HistoryWeekStep
        direction="next"
        to={nextWeekOf(shown, current)}
        current={current}
        label={m.history_week_next({}, { locale })}
      />
      <Button
        className="ml-2 rounded-[14px] bg-foreground px-4 font-bold text-background hover:bg-foreground/85"
        nativeButton={false}
        render={<Link to="/history" search={{}} />}
      >
        {m.history_this_week({}, { locale })}
      </Button>
    </nav>
  );
};

import type { QueryClient } from "@tanstack/react-query";

import { historyActivityQueryOptions, historyWeekQueryOptions } from "@/api/duel-history";
import { friezeRange, historyViewOf, weekRange } from "@/components/history/history-week";

// What the History loads for the `week` of its URL at `now`: that week's Duels and its frieze's
// Activity, both at once. The view it read the clock for, for the page to show.
export const loadHistory = async (
  queryClient: QueryClient,
  week: string | undefined,
  now: number,
) => {
  const view = historyViewOf(week, now);

  await Promise.all([
    queryClient.ensureQueryData(historyWeekQueryOptions(weekRange(view.shown))),
    queryClient.ensureQueryData(historyActivityQueryOptions(friezeRange(view.friezeEnd))),
  ]);

  return view;
};

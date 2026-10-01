import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { historyActivityQueryOptions, historyWeekQueryOptions } from "@/api/duel-history";
import { friezeRange, weekRange } from "@/components/history/history-week";

const route = getRouteApi("/history");

// What the History shows, as its loader read it at the time of the load: the week shown, the
// current one, the frieze's last week and today.
export const useHistoryView = () => route.useLoaderData();

// The Duels of the week shown, loaded by the route.
export const useShownWeek = () => {
  const { shown } = useHistoryView();

  return useSuspenseQuery(historyWeekQueryOptions(weekRange(shown))).data;
};

// The Activity of the frieze's 16 weeks, loaded by the route.
export const useFriezeActivity = () => {
  const { friezeEnd } = useHistoryView();

  return useSuspenseQuery(historyActivityQueryOptions(friezeRange(friezeEnd))).data;
};

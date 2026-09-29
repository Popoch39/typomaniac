import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

import { duelHistoryQueryOptions } from "@/api/duel-history";
import { DuelDetails } from "@/components/duel-history/duel-details";
import { DuelHistoryColumns } from "@/components/duel-history/duel-history-columns";
import { DuelHistoryEmpty } from "@/components/duel-history/duel-history-empty";
import { DuelHistoryList } from "@/components/duel-history/duel-history-list";
import { DuelHistorySkeleton } from "@/components/duel-history/duel-history-skeleton";
import { NextPageSentinel } from "@/components/duel-history/next-page-sentinel";
import { useChosenDuel } from "@/components/duel-history/use-chosen-duel";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The User's finished Duels, the most recent first, and beside them the chosen one: the next page
// loads once the bottom of the list shows.
export const DuelHistory = () => {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(duelHistoryQueryOptions);

  const duels = data.pages.flatMap((page) => page.duels);
  const { chosen, choose } = useChosenDuel(duels);
  const locale = useLocale();

  // No Duel chosen only when there is none at all.
  if (chosen === undefined) {
    return <DuelHistoryEmpty />;
  }

  const loadNextPage = () => {
    if (!isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  return (
    <DuelHistoryColumns
      list={
        <>
          <DuelHistoryList duels={duels} chosenId={chosen.id} onChoose={choose} />
          {hasNextPage ? <NextPageSentinel onVisible={loadNextPage} /> : null}
          {isFetchingNextPage ? (
            <DuelHistorySkeleton label={m.duel_history_loading_more({}, { locale })} rows={2} />
          ) : null}
        </>
      }
      // A new Duel chosen, a new details: its loading and its error start over.
      details={<DuelDetails key={chosen.id} duel={chosen} />}
    />
  );
};

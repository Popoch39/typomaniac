import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

import { duelHistoryQueryOptions } from "@/api/duel-history";
import { DuelHistoryItem } from "@/components/duel-history/duel-history-item";
import { NextPageSentinel } from "@/components/duel-history/next-page-sentinel";

// The User's finished Duels, the most recent first: the next page loads once the bottom of the list
// shows. One Duel at a time opens in place.
export const DuelHistory = () => {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(duelHistoryQueryOptions);

  // The one Duel opened in place, if any.
  const [openId, setOpenId] = useState<string | null>(null);

  const duels = data.pages.flatMap((page) => page.duels);

  if (duels.length === 0) {
    return (
      <p className="text-muted-foreground">
        Aucun Duel pour l'instant : ta Duel history se remplit à chaque Duel que tu termines.
      </p>
    );
  }

  const loadNextPage = () => {
    if (!isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <ul aria-label="Duel history" className="flex flex-col divide-y border border-foreground/15">
        {duels.map((duel) => (
          <DuelHistoryItem
            key={duel.id}
            duel={duel}
            open={openId === duel.id}
            onToggle={() => setOpenId((open) => (open === duel.id ? null : duel.id))}
          />
        ))}
      </ul>
      {hasNextPage ? <NextPageSentinel onVisible={loadNextPage} /> : null}
      {isFetchingNextPage ? (
        <p className="text-center text-[0.7rem] text-muted-foreground">Chargement…</p>
      ) : null}
    </div>
  );
};

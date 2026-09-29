import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { DUEL_PATH } from "@/components/duel/duel-path";
import { usePlayStore } from "@/stores/play-store";
import type { DuelSeat } from "@/stores/duel-store";

// The screen of the Duel that takes the User's place in this tab: the Duel's own URL, or the Queue
// once the search is launched, on whatever page they go to meanwhile (ADR 0012). None otherwise,
// nor for a Visitor.
export const useDuelSeat = (): DuelSeat | null => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const onDuelPage = useLocation({ select: (location) => location.pathname === DUEL_PATH });
  const searching = usePlayStore((state) => state.play === "duel");

  if (me === null) {
    return null;
  }

  if (onDuelPage) {
    return "duel";
  }

  return searching ? "queue" : null;
};

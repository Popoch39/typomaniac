import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { DUEL_PATH } from "@/components/duel/duel-path";
import { usePlayStore } from "@/stores/play-store";
import type { DuelSeat } from "@/stores/duel-store";

// The screen of the Duel this page shows, which takes the User's place: the Duel's own URL, or the
// play page with Duel chosen. None elsewhere, nor for a Visitor.
export const useDuelSeat = (): DuelSeat | null => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const pathname = useLocation({ select: (location) => location.pathname });
  const duelChosen = usePlayStore((state) => state.play === "duel");

  if (me === null) {
    return null;
  }

  if (pathname === DUEL_PATH) {
    return "duel";
  }

  return pathname === "/" && duelChosen ? "queue" : null;
};

import { useNavigate, useSearch } from "@tanstack/react-router";

import type { DuelHistoryEntry } from "@/api/duel-history";

// The Duel chosen on the Duels page, kept in the URL (`?duel=<id>`), and how to choose another. The
// most recent one when the URL names none, or one not in the list read so far.
export const useChosenDuel = (duels: DuelHistoryEntry[]) => {
  const duelId = useSearch({ from: "/duels", select: (search) => search.duel });
  const navigate = useNavigate({ from: "/duels" });

  const chosen = duels.find((duel) => duel.id === duelId) ?? duels[0];

  // Choosing replaces the entry: going back leaves the page, not the Duels chosen one by one.
  const choose = (id: string) => {
    void navigate({ search: { duel: id }, replace: true, resetScroll: false });
  };

  return { chosen, choose };
};

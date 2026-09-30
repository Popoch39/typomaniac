import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { useDuelSearchGesture } from "@/components/duel/use-duel-search-gesture";
import { recordSearchForm } from "@/components/search-morph/search-form";
import { useAuthStore } from "@/stores/auth-store";
import { usePlayStore } from "@/stores/play-store";

// Chooses the Duel, whose screen joins the Queue, from a click: it lets the Face-off sound and the
// Match proposal notify. A Duel needs an account: a Visitor is asked to sign in instead. Says
// whether the Duel was chosen. From Jouer's Ranked card, the search comes out of it.
export const useChooseDuel = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const setPlay = usePlayStore((state) => state.setPlay);
  const setSignInOpen = useAuthStore((state) => state.setSignInOpen);
  const searchGesture = useDuelSearchGesture();

  return () => {
    if (me === null) {
      setSignInOpen(true);

      return false;
    }

    searchGesture();
    recordSearchForm();
    setPlay("duel");

    return true;
  };
};

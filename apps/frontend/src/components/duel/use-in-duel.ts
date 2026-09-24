import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { usePlayStore } from "@/stores/play-store";

// Duel is chosen and a User is signed in: a Visitor, or a User who signed out, is in Solo.
export const useInDuel = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const duelChosen = usePlayStore((state) => state.play === "duel");

  return duelChosen && me !== null;
};

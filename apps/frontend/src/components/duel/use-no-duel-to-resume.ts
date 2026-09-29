import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { useConnectionStore } from "@/stores/connection-store";

// The Duel's URL has no Duel to resume in this tab: no User (signed out), or the server told a
// place that is none (idle, or the Queue's, held here or in another tab). Unknown while the place
// is.
export const useNoDuelToResume = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const placeAt = useConnectionStore((store) => store.place?.at ?? null);

  return me === null || (placeAt !== null && placeAt !== "duel");
};

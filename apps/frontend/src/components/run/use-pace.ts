import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { paceQueryOptions } from "@/api/pace";

// The Pace a solo Run judges the Bursts against: the User's, or the default one for a Visitor.
export const usePace = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const { data: pace } = useSuspenseQuery(paceQueryOptions(me));

  return pace;
};

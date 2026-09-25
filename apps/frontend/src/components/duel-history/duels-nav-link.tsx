import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { NavPill } from "@/components/ui/nav-pill";

// The way to the Duel history, for a User with a Session only: a Visitor has no Duels.
export const DuelsNavLink = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return me ? <NavPill to="/duels">Duels</NavPill> : null;
};

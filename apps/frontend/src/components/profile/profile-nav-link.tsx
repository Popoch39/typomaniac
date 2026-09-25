import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { NavPill } from "@/components/ui/nav-pill";

// The way to the User's own profile, for a User with a Session only: a Visitor has none.
export const ProfileNavLink = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return me ? <NavPill to="/profile">Profil</NavPill> : null;
};

import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { RailUserMenu } from "@/components/sidebar/rail-user-menu";
import { RailVisitorButton } from "@/components/sidebar/rail-visitor-button";
import { UserCard } from "@/components/sidebar/user-card";
import { useSidebarRail } from "@/components/sidebar/use-sidebar-rail";
import { VisitorCard } from "@/components/sidebar/visitor-card";

// The bottom of the sidebar: the User's card, or the Visitor's invitation to sign in. In the Rail,
// the User's avatar that opens their menu, or the Visitor's way to sign in.
export const SidebarAccount = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const rail = useSidebarRail();

  if (rail) {
    return me ? <RailUserMenu me={me} /> : <RailVisitorButton />;
  }

  return me ? <UserCard me={me} /> : <VisitorCard />;
};

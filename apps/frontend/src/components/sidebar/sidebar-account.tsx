import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { UserCard } from "@/components/sidebar/user-card";
import { VisitorCard } from "@/components/sidebar/visitor-card";

// The bottom of the sidebar: the User's card, or the Visitor's invitation to sign in.
export const SidebarAccount = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return me ? <UserCard me={me} /> : <VisitorCard />;
};

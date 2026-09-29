import { useSuspenseQuery } from "@tanstack/react-query";
import {
  KeyboardIcon,
  ShieldIcon,
  SwordsIcon,
  TrophyIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

import { meQueryOptions } from "@/api/me";
import { FriendRequestsBadge } from "@/components/friends/friend-requests-badge";
import { SidebarNavLink } from "@/components/sidebar/sidebar-nav-link";
import { SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";

// Play only when on "/" itself: every path starts with it.
const homeActiveOptions = { exact: true };

// The app's main nav: Jouer, Ranked and Classement for everyone; Duels, Friends and Profil with a
// Session only, a Visitor has none. With a Handle, the Friend requests received on Friends.
export const SidebarNav = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return (
    <SidebarGroup render={<nav aria-label="Navigation principale" />}>
      <SidebarMenu>
        <SidebarNavLink
          to="/"
          activeOptions={homeActiveOptions}
          icon={KeyboardIcon}
          label="Jouer"
        />
        <SidebarNavLink to="/ranked" icon={ShieldIcon} label="Ranked" />
        <SidebarNavLink to="/leaderboard" icon={TrophyIcon} label="Classement" />
        {me === null ? null : (
          <>
            <SidebarNavLink to="/duels" icon={SwordsIcon} label="Duels" />
            <SidebarNavLink
              to="/friends"
              icon={UsersIcon}
              label="Friends"
              badge={me.handle === null ? null : <FriendRequestsBadge />}
            />
            <SidebarNavLink to="/profile" icon={UserRoundIcon} label="Profil" />
          </>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
};

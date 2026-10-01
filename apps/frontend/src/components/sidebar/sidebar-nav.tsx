import { useSuspenseQuery } from "@tanstack/react-query";
import {
  HistoryIcon,
  KeyboardIcon,
  ShieldIcon,
  TrophyIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

import { meQueryOptions } from "@/api/me";
import { FriendRequestsBadge } from "@/components/friends/friend-requests-badge";
import { QueueWaitBadge } from "@/components/sidebar/queue-wait-badge";
import { QueueWaitHint } from "@/components/sidebar/queue-wait-hint";
import { SidebarNavLink } from "@/components/sidebar/sidebar-nav-link";
import { SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Play only when on "/" itself: every path starts with it.
const homeActiveOptions = { exact: true };

// The app's main nav: Play, Ranked and the Leaderboard for everyone; the History, Friends and the
// Profile with a Session only, a Visitor has none. On Play, the User's wait in the Queue; with a
// Handle, the Friend requests received on Friends.
export const SidebarNav = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const locale = useLocale();

  return (
    <SidebarGroup render={<nav aria-label={m.sidebar_nav_label({}, { locale })} />}>
      <SidebarMenu>
        <SidebarNavLink
          to="/"
          activeOptions={homeActiveOptions}
          icon={KeyboardIcon}
          label={m.sidebar_nav_play({}, { locale })}
          badge={me === null ? null : <QueueWaitBadge />}
          hint={me === null ? null : <QueueWaitHint />}
        />
        <SidebarNavLink
          to="/ranked"
          icon={ShieldIcon}
          label={m.sidebar_nav_ranked({}, { locale })}
        />
        <SidebarNavLink
          to="/leaderboard"
          icon={TrophyIcon}
          label={m.sidebar_nav_leaderboard({}, { locale })}
        />
        {me === null ? null : (
          <>
            <SidebarNavLink
              to="/history"
              icon={HistoryIcon}
              label={m.sidebar_nav_history({}, { locale })}
            />
            <SidebarNavLink
              to="/friends"
              icon={UsersIcon}
              label={m.sidebar_nav_friends({}, { locale })}
              badge={me.handle === null ? null : <FriendRequestsBadge />}
            />
            <SidebarNavLink
              to="/profile"
              icon={UserRoundIcon}
              label={m.sidebar_nav_profile({}, { locale })}
            />
          </>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
};

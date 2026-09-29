import { SidebarMenuBadge } from "@/components/ui/sidebar";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useConnectionStore } from "@/stores/connection-store";

// The number of Friend requests waiting for the User's answer, on the sidebar's way to the
// Friends, as the real-time connection keeps it. Nothing until it is told, or when none waits: the
// sidebar never waits for it.
export const FriendRequestsBadge = () => {
  const count = useConnectionStore((store) => store.friends?.requestsReceived ?? 0);
  const locale = useLocale();
  const shown = numberFormat(locale).format(count);

  return count > 0 ? (
    <SidebarMenuBadge aria-label={m.sidebar_friend_requests({ count, shown }, { locale })}>
      {shown}
    </SidebarMenuBadge>
  ) : null;
};

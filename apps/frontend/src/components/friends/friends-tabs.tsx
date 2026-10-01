import { Tabs } from "@base-ui/react/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";

import { friendRequestsQueryOptions, friendsQueryOptions } from "@/api/friends";
import { FriendList } from "@/components/friends/friend-list";
import { FriendRequestsCount } from "@/components/friends/friend-requests-count";
import { FriendRequestsReceived } from "@/components/friends/friend-requests-received";
import { FriendRequestsSent } from "@/components/friends/friend-requests-sent";
import { FriendsTab } from "@/components/friends/friends-tab";
import { FriendsTabCount } from "@/components/friends/friends-tab-count";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type FriendsTabsProps = {
  // Where the empty list of Friends sends the User to find some.
  searchInputId: string;
};

// The User's Friends, the Friend requests waiting for their answer, and those they sent, one tab
// each: the Friends first. Each tab says how many; the requests waiting, in a badge of the accent.
export const FriendsTabs = ({ searchInputId }: FriendsTabsProps) => {
  const { data: friends } = useSuspenseQuery(friendsQueryOptions);
  const { data: requests } = useSuspenseQuery(friendRequestsQueryOptions);
  const locale = useLocale();

  return (
    <Tabs.Root defaultValue="friends" className="flex min-h-0 flex-1 flex-col gap-4">
      <Tabs.List
        aria-label={m.friends_tabs_label({}, { locale })}
        className="flex shrink-0 gap-1 self-start rounded-full bg-card p-1"
      >
        <FriendsTab
          value="friends"
          label={m.friends_tab_friends({}, { locale })}
          count={<FriendsTabCount count={friends.length} />}
        />
        <FriendsTab
          value="requests"
          label={m.friends_tab_requests({}, { locale })}
          count={
            requests.received.length > 0 ? (
              <FriendRequestsCount count={requests.received.length} />
            ) : null
          }
        />
        <FriendsTab
          value="sent"
          label={m.friends_tab_sent({}, { locale })}
          count={<FriendsTabCount count={requests.sent.length} />}
        />
      </Tabs.List>
      <FriendList friends={friends} searchInputId={searchInputId} />
      <FriendRequestsReceived received={requests.received} />
      <FriendRequestsSent sent={requests.sent} />
    </Tabs.Root>
  );
};

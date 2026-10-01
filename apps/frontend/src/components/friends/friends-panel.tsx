import { Tabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

import { FRIENDS_GRID_PAINT } from "@/components/friends/friends-paint";
import type { FriendsTabValue } from "@/components/friends/friends-tab";

type FriendsPanelProps = {
  value: FriendsTabValue;
  isEmpty: boolean;
  // Shown instead of the rows when there are none.
  empty: ReactNode;
  children: ReactNode;
};

// What one tab of the Friends page shows: its rows on their card, or why there are none. Takes the
// height left under the tabs.
export const FriendsPanel = ({ value, isEmpty, empty, children }: FriendsPanelProps) => (
  <Tabs.Panel
    value={value}
    className="@container flex min-h-0 flex-1 flex-col rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    {isEmpty ? empty : <ul className={FRIENDS_GRID_PAINT}>{children}</ul>}
  </Tabs.Panel>
);

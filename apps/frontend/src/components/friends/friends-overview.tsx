import { useId } from "react";

import { ActivityColumn } from "@/components/activity/activity-column";
import { FriendList } from "@/components/friends/friend-list";
import { FriendRequestsReceived } from "@/components/friends/friend-requests-received";
import { FriendRequestsSent } from "@/components/friends/friend-requests-sent";
import { UserSearch } from "@/components/friends/user-search";

// Everything of a User with a Handle on the Friends page: the search, the requests, the Friends,
// and next to them their Activity.
export const FriendsOverview = () => {
  const searchInputId = useId();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-8">
        <UserSearch inputId={searchInputId} />
        <FriendRequestsReceived />
        <FriendRequestsSent />
        <FriendList searchInputId={searchInputId} />
      </div>
      <ActivityColumn searchInputId={searchInputId} />
    </div>
  );
};

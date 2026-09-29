import { useId } from "react";

import { ActivityColumn } from "@/components/activity/activity-column";
import { FriendList } from "@/components/friends/friend-list";
import { FriendRequestsReceived } from "@/components/friends/friend-requests-received";
import { FriendRequestsSent } from "@/components/friends/friend-requests-sent";
import { FriendsColumns } from "@/components/friends/friends-columns";
import { UserSearch } from "@/components/friends/user-search";

// Everything of a User with a Handle on the Friends page: the search, the requests, the Friends,
// and next to them their Activity.
export const FriendsOverview = () => {
  const searchInputId = useId();

  return (
    <FriendsColumns
      lists={
        <>
          <UserSearch inputId={searchInputId} />
          <FriendRequestsReceived />
          <FriendRequestsSent />
          <FriendList searchInputId={searchInputId} />
        </>
      }
      activity={<ActivityColumn searchInputId={searchInputId} />}
    />
  );
};

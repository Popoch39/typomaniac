import { useId } from "react";

import { ActivityColumn } from "@/components/activity/activity-column";
import { FriendsColumns } from "@/components/friends/friends-columns";
import { FriendsHeader } from "@/components/friends/friends-header";
import { FriendsTabs } from "@/components/friends/friends-tabs";
import { UserSearch } from "@/components/friends/user-search";

// Everything of a User with a Handle on the Friends page: the search in the header, the Friends and
// the Friend requests under their tabs, and next to them their Activity.
export const FriendsOverview = () => {
  const searchInputId = useId();

  return (
    <>
      <FriendsHeader search={<UserSearch inputId={searchInputId} />} />
      <FriendsColumns
        lists={<FriendsTabs searchInputId={searchInputId} />}
        activity={<ActivityColumn searchInputId={searchInputId} />}
      />
    </>
  );
};

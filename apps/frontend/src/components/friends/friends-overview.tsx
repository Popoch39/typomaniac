import { FriendList } from "@/components/friends/friend-list";
import { FriendRequestsReceived } from "@/components/friends/friend-requests-received";
import { FriendRequestsSent } from "@/components/friends/friend-requests-sent";
import { UserSearch } from "@/components/friends/user-search";

// Everything of a User with a Handle on the Friends page: the search, the requests, the Friends.
export const FriendsOverview = () => (
  <div className="flex flex-col gap-8">
    <UserSearch />
    <FriendRequestsReceived />
    <FriendRequestsSent />
    <FriendList />
  </div>
);

import { useSuspenseQuery } from "@tanstack/react-query";

import { friendsQueryOptions } from "@/api/friends";
import { FriendRow } from "@/components/friends/friend-row";
import { FriendsEmpty } from "@/components/friends/friends-empty";
import { FriendsListSection } from "@/components/friends/friends-list-section";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The User's Friends, by Handle, each with their Presence: one online can be challenged.
type FriendListProps = {
  // Where the empty list sends the User to find some.
  searchInputId: string;
};

export const FriendList = ({ searchInputId }: FriendListProps) => {
  const { data: friends } = useSuspenseQuery(friendsQueryOptions);
  const locale = useLocale();

  return (
    <FriendsListSection
      title={m.friends_list_title(
        { count: numberFormat(locale).format(friends.length) },
        { locale },
      )}
      isEmpty={friends.length === 0}
      empty={<FriendsEmpty searchInputId={searchInputId} />}
    >
      {friends.map((friend) => (
        <FriendRow key={friend.id} friend={friend} />
      ))}
    </FriendsListSection>
  );
};

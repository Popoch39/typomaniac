import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { FriendsChallengeLink } from "@/components/play/friends-challenge-link";
import { FriendsFaceToFace } from "@/components/play/friends-face-to-face";
import { FriendsLive } from "@/components/play/friends-live";
import { PlayCard } from "@/components/play/play-card";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The card of the Duel with a Friend: what the User's Friends do right now, then the way to
// Friends, where each one online is challenged. A Visitor sees the User's place facing an empty one.
export const FriendsDuelCard = () => {
  const locale = useLocale();
  const { data: me } = useSuspenseQuery(meQueryOptions);

  return (
    <PlayCard
      title={m.play_friends_title({}, { locale })}
      pitch={m.play_friends_pitch({}, { locale })}
      live={me === null ? <FriendsFaceToFace /> : <FriendsLive readerId={me.id} />}
      className="bg-card"
      pitchClassName="text-muted-foreground"
    >
      <FriendsChallengeLink />
    </PlayCard>
  );
};

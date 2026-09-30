import { FriendsChallengeLink } from "@/components/play/friends-challenge-link";
import { FriendsFaceToFace } from "@/components/play/friends-face-to-face";
import { PlayCard } from "@/components/play/play-card";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The card of the Duel with a Friend: the User facing a Friend online, then the way to Friends,
// where each one online is challenged.
export const FriendsDuelCard = () => {
  const locale = useLocale();

  return (
    <PlayCard
      title={m.play_friends_title({}, { locale })}
      pitch={m.play_friends_pitch({}, { locale })}
      live={<FriendsFaceToFace />}
      className="bg-card"
      pitchClassName="text-muted-foreground"
    >
      <FriendsChallengeLink />
    </PlayCard>
  );
};

import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";
import type { LiveChallenges, LiveFriends, Place } from "@/stores/connection-store";

// Why the User cannot challenge this Friend right now, in the Locale, or null when they can: what
// the Challenge button says while disabled.
export const challengeBlocker = (
  {
    place,
    friends,
    challenges,
  }: { place: Place | null; friends: LiveFriends | null; challenges: LiveChallenges | null },
  friendId: string,
  locale: Locale,
) => {
  if (friends === null || challenges === null) {
    return m.challenge_blocker_connecting({}, { locale });
  }

  if (place?.at === "duel") {
    return m.challenge_blocker_self_in_duel({}, { locale });
  }

  if (challenges.sent?.to.id === friendId) {
    return m.challenge_blocker_sent_to_them({}, { locale });
  }

  if (challenges.sent !== null) {
    return m.challenge_blocker_sent_to_other({}, { locale });
  }

  switch (friends.presences.get(friendId) ?? "offline") {
    case "offline":
      return m.challenge_blocker_offline({}, { locale });
    case "in-duel":
      return m.challenge_blocker_in_duel({}, { locale });
    case "online":
      return null;
  }
};

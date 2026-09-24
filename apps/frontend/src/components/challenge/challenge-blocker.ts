import type { LiveChallenges, LiveFriends, Place } from "@/stores/connection-store";

// Why the User cannot challenge this Friend right now, or null when they can: what the Défier
// button says while disabled.
export const challengeBlocker = (
  {
    place,
    friends,
    challenges,
  }: { place: Place | null; friends: LiveFriends | null; challenges: LiveChallenges | null },
  friendId: string,
) => {
  if (friends === null || challenges === null) {
    return "Connexion au serveur…";
  }

  if (place?.at === "duel") {
    return "Tu es en Duel";
  }

  if (challenges.sent?.to.id === friendId) {
    return "Challenge envoyé, en attente de sa réponse";
  }

  if (challenges.sent !== null) {
    return "Un Challenge attend déjà sa réponse";
  }

  switch (friends.presences.get(friendId) ?? "offline") {
    case "offline":
      return "Hors ligne";
    case "in-duel":
      return "En Duel";
    case "online":
      return null;
  }
};

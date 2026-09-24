import type { FriendRefusal } from "api";

import { ApiError } from "@/api/client";
import { friendRefusalOf } from "@/api/friends";

// What the User reads when the API refuses one of their actions, for each rule it names.
const refusals: Record<FriendRefusal, string> = {
  self: "Tu ne peux pas être ton propre Friend.",
  "user-not-found": "Ce User n'existe plus ou n'a pas de Handle.",
  "already-friends": "Vous êtes déjà Friends.",
  "already-requested": "Une Friend request attend déjà sa réponse.",
  "request-limit":
    "Trop de Friend requests envoyées en attente : annules-en ou attends leurs réponses.",
  "friend-limit": "Tu as atteint le nombre maximum de Friends.",
  "their-friend-limit": "Ce User a atteint le nombre maximum de Friends.",
  "request-not-found": "Cette Friend request n'existe plus.",
  "not-friends": "Vous n'êtes plus Friends.",
};

const FAILED = "L'action a échoué. Réessaie.";

const isFriendRefusal = (reason: string): reason is FriendRefusal =>
  Object.hasOwn(refusals, reason);

// The message for a failed action: the rule it broke, the rate limit, or a plain failure.
export const friendErrorMessage = (error: Error) => {
  if (!(error instanceof ApiError)) {
    return FAILED;
  }

  if (error.status === 429) {
    return "Trop de Friend requests d'affilée : patiente un instant.";
  }

  const reason = friendRefusalOf(error.value);

  return reason !== null && isFriendRefusal(reason) ? refusals[reason] : FAILED;
};

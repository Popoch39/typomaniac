import type { ChallengeEnding, ChallengeRefusal } from "api";

import { atHandle } from "@/lib/at-handle";

// What the User reads when the server refuses to send their Challenge, for each rule it names.
const refusals: Record<ChallengeRefusal, string> = {
  "handle-required": "Choisis d'abord ton Handle : un Duel montre celui de chaque joueur.",
  self: "Tu ne peux pas te défier toi-même.",
  "not-friends": "Vous n'êtes pas Friends.",
  offline: "Ce Friend est hors ligne.",
  "in-duel": "Impossible pendant un Duel.",
  "already-challenging": "Ton Challenge précédent attend encore sa réponse.",
};

export const challengeRefusalMessage = (reason: ChallengeRefusal) => refusals[reason];

// What the sender reads when their Challenge ends without a Duel, or nothing: they cancelled it,
// or the Duel starts.
export const sentChallengeEndingMessage = (handle: string, reason: ChallengeEnding) => {
  switch (reason) {
    case "declined":
      return `${atHandle(handle)} a refusé ton Challenge.`;
    case "expired":
      return `${atHandle(handle)} n'a pas répondu à ton Challenge.`;
    case "unavailable":
      return `${atHandle(handle)} n'est plus disponible pour ton Challenge.`;
    case "accepted":
    case "cancelled":
      return null;
  }
};

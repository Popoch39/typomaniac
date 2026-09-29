import type { ChallengeEnding, ChallengeRefusal } from "api";

import { atHandle } from "@/lib/at-handle";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// What the User reads when the server refuses to send their Challenge, for each rule it names.
const REFUSALS = {
  "handle-required": m.challenge_refusal_handle_required,
  self: m.challenge_refusal_self,
  "not-friends": m.challenge_refusal_not_friends,
  offline: m.challenge_refusal_offline,
  "in-duel": m.challenge_refusal_in_duel,
  "already-challenging": m.challenge_refusal_already_challenging,
} satisfies Record<ChallengeRefusal, typeof m.challenge_refusal_self>;

export const challengeRefusalMessage = (reason: ChallengeRefusal, locale: Locale) =>
  REFUSALS[reason]({}, { locale });

// What the sender reads when their Challenge ends without a Duel, or nothing: they cancelled it,
// or the Duel starts.
export const sentChallengeEndingMessage = (
  handle: string,
  reason: ChallengeEnding,
  locale: Locale,
) => {
  const inputs = { handle: atHandle(handle) };

  switch (reason) {
    case "declined":
      return m.challenge_ended_declined(inputs, { locale });
    case "expired":
      return m.challenge_ended_expired(inputs, { locale });
    case "unavailable":
      return m.challenge_ended_unavailable(inputs, { locale });
    case "accepted":
    case "cancelled":
      return null;
  }
};

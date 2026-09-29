import type { FriendRefusal } from "api";

import { ApiError } from "@/api/client";
import { friendRefusalOf } from "@/api/friends";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// What the User reads when the API refuses one of their actions, for each rule it names.
const REFUSALS = {
  self: m.friends_refusal_self,
  "user-not-found": m.friends_refusal_user_not_found,
  "already-friends": m.friends_refusal_already_friends,
  "already-requested": m.friends_refusal_already_requested,
  "request-limit": m.friends_refusal_request_limit,
  "friend-limit": m.friends_refusal_friend_limit,
  "their-friend-limit": m.friends_refusal_their_friend_limit,
  "request-not-found": m.friends_refusal_request_not_found,
  "not-friends": m.friends_refusal_not_friends,
} satisfies Record<FriendRefusal, typeof m.friends_refusal_self>;

const isFriendRefusal = (reason: string): reason is FriendRefusal =>
  Object.hasOwn(REFUSALS, reason);

// The message for a failed action, in the Locale: the rule it broke, the rate limit, or a plain
// failure.
export const friendErrorMessage = (error: Error, locale: Locale) => {
  if (!(error instanceof ApiError)) {
    return m.friends_action_failed({}, { locale });
  }

  if (error.code === "TOO_MANY_REQUESTS") {
    return m.friends_refusal_too_many({}, { locale });
  }

  const reason = friendRefusalOf(error);

  return reason !== null && isFriendRefusal(reason)
    ? REFUSALS[reason]({}, { locale })
    : m.friends_action_failed({}, { locale });
};

import type { Presence } from "api";

import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// A Presence in words, wherever a Friend's is shown.
const PRESENCE_MESSAGES = {
  online: m.friends_presence_online,
  "in-duel": m.friends_presence_in_duel,
  offline: m.friends_presence_offline,
} satisfies Record<Presence, typeof m.friends_presence_online>;

export const presenceLabel = (presence: Presence, locale: Locale) =>
  PRESENCE_MESSAGES[presence]({}, { locale });

// The colour of a Presence's dot.
export const PRESENCE_DOTS: Record<Presence, string> = {
  online: "bg-online",
  "in-duel": "bg-caret",
  offline: "bg-faint",
};

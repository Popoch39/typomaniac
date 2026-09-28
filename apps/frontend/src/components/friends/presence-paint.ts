import type { Presence } from "api";

// A Presence in words, wherever a Friend's is shown.
export const PRESENCE_LABELS: Record<Presence, string> = {
  online: "en ligne",
  "in-duel": "en Duel",
  offline: "hors ligne",
};

// The colour of a Presence's dot.
export const PRESENCE_DOTS: Record<Presence, string> = {
  online: "bg-online",
  "in-duel": "bg-caret",
  offline: "bg-faint",
};

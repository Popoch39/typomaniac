import { atHandle } from "@/lib/at-handle";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// How a finished Duel names the opponent: by their Handle of today, or as gone once their User is
// deleted, in the Locale.
export const opponentName = (opponent: { handle: string } | null, locale: Locale) =>
  opponent ? atHandle(opponent.handle) : m.opponent_deleted({}, { locale });

import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// What kind of Duel it was, in words, in the Locale: Ranked (Placement included) or a Challenge. A
// Duel played before the ranked is a Challenge too.
export const duelKind = (ranked: boolean, locale: Locale) =>
  ranked ? m.duel_kind_ranked({}, { locale }) : m.duel_kind_challenge({}, { locale });

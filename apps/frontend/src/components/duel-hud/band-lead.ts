import { atHandle } from "@/lib/at-handle";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// Who leads the Duel, seen by this User: themself, their opponent, or no one at equal Scores.
export type Leader = "self" | "opponent" | "none";

export const leaderOf = (lead: number): Leader => {
  if (lead === 0) {
    return "none";
  }

  return lead > 0 ? "self" : "opponent";
};

// Where the split between the two colours of the band stands, in % of its width from the left:
// the middle at equal Scores, towards the led one's edge as the Lead grows, never reaching it.
export const bandSplit = (lead: number) => 50 + 44 * Math.tanh(lead / 60);

// What screen readers read of the band, in the Locale: who leads, and by how much.
export const bandLabel = (lead: number, opponentHandle: string, locale: Locale) => {
  const count = Math.abs(lead);
  const points = { count, shown: numberFormat(locale).format(count) };

  switch (leaderOf(lead)) {
    case "self":
      return m.hud_lead_self(points, { locale });
    case "opponent":
      return m.hud_lead_opponent({ ...points, opponent: atHandle(opponentHandle) }, { locale });
    case "none":
      return m.hud_lead_none({}, { locale });
  }
};

// The Lead under the seconds of the disc, in the Locale: « +N » whoever leads, « = » at equal
// Scores.
export const discLead = (lead: number, locale: Locale) =>
  lead === 0 ? "=" : `+${numberFormat(locale).format(Math.abs(lead))}`;

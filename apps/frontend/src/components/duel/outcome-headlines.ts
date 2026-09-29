import type { DuelOutcome } from "api";

import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

const HEADLINES = { win: m.outcome_win, loss: m.outcome_loss, draw: m.outcome_draw };

// A Duel's outcome from the User's side, in a word, in the Locale: the end screen and the Duel
// history.
export const outcomeHeadline = (outcome: DuelOutcome, locale: Locale) =>
  HEADLINES[outcome]({}, { locale });

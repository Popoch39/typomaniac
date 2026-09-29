import type { DuelSide } from "@/components/replay/replay-sides";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// A Run of the Replay named by its player, as the choice of the Run and the Text say it, in the
// Locale.
export const replayRunName = (side: DuelSide, opponentName: string, locale: Locale) =>
  side === "own"
    ? m.replay_run_own({}, { locale })
    : m.replay_run_opponent({ opponent: opponentName }, { locale });

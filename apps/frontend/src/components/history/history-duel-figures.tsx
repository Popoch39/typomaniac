import type { DuelHistoryEntry } from "@/api/duel-history";
import { duelNumber } from "@/components/duel-history/duel-number";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// At the foot of a Duel's card: a Bo3's count of the Rounds won (« 2 vs 1 »), or for a Duel of a
// single Round (a Challenge, a Duel from before the Bo3) both Scores, each in its player's colour.
export const HistoryDuelFigures = ({ duel }: { duel: DuelHistoryEntry }) => {
  const locale = useLocale();
  const series = duel.roundsToWin > 1;

  return (
    <span data-figures={series ? "rounds" : "scores"}>
      <span className="font-medium text-caret">
        {series ? duel.roundsWon : duelNumber(duel.score, locale)}
      </span>{" "}
      <span className="text-faint">{m.history_card_versus({}, { locale })}</span>{" "}
      <span className="text-opponent-caret">
        {duelNumber(series ? duel.opponentRoundsWon : duel.opponentScore, locale)}
      </span>
    </span>
  );
};

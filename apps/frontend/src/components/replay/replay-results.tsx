import type { ReplayedDuel } from "@/api/duel-history";
import { PlayerResult } from "@/components/duel/player-result";
import { opponentName } from "@/lib/opponent-name";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Both Results and Scores at the end of the Replay, side by side where the Score cards and the Text
// stood, as the end screen of the Duel showed them.
export const ReplayResults = ({ duel }: { duel: ReplayedDuel }) => {
  const locale = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4">
      <PlayerResult
        name={m.duel_self({}, { locale })}
        result={duel.me.result}
        score={duel.me.score}
      />
      {duel.opponent ? (
        <PlayerResult
          name={opponentName(duel.opponent, locale)}
          result={duel.opponent.result}
          score={duel.opponent.score}
          opponent
        />
      ) : null}
    </div>
  );
};

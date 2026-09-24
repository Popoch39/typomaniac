import type { ReplayedDuel } from "@/api/duel-history";
import { PlayerResult } from "@/components/duel/player-result";
import { opponentName } from "@/lib/opponent-name";

// Both Results and Scores at the end of the Replay, as the end screen of the Duel showed them.
export const ReplayResults = ({ duel }: { duel: ReplayedDuel }) => (
  <div className="grid gap-8 md:grid-cols-2">
    <PlayerResult name="Toi" result={duel.me.result} score={duel.me.score} />
    {duel.opponent ? (
      <PlayerResult
        name={opponentName(duel.opponent)}
        result={duel.opponent.result}
        score={duel.opponent.score}
        opponent
      />
    ) : null}
  </div>
);

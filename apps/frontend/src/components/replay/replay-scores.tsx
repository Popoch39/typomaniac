import { PlayerLiveScore } from "@/components/duel/player-live-score";
import type { ReplaySide } from "@/components/replay/replay-sides";

type ReplayScoresProps = { own: ReplaySide; opponent: ReplaySide | null; opponentName: string };

// Both Scores as they showed in play. None for a Duel played before the Score.
export const ReplayScores = ({ own, opponent, opponentName }: ReplayScoresProps) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    {own.score === null ? null : <PlayerLiveScore name="Toi" score={own.score} />}
    {opponent?.score ? (
      <PlayerLiveScore name={opponentName} score={opponent.score} opponent />
    ) : null}
  </div>
);

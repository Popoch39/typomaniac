import { ReplayScoreCard } from "@/components/replay/replay-score-card";
import type { DuelSide, ReplaySide } from "@/components/replay/replay-sides";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type ReplayScoresProps = {
  own: ReplaySide;
  opponent: ReplaySide | null;
  opponentName: string;
  // The side whose Run is on the Text.
  shownSide: DuelSide;
};

// Both sides side by side at the Replay's instant, the User's first. The User's alone once their
// opponent is deleted.
export const ReplayScores = ({ own, opponent, opponentName, shownSide }: ReplayScoresProps) => {
  const locale = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4">
      <ReplayScoreCard
        name={m.duel_self({}, { locale })}
        label={m.replay_score_own({}, { locale })}
        tone="own"
        side={own}
        shown={shownSide === "own"}
      />
      {opponent === null ? null : (
        <ReplayScoreCard
          name={opponentName}
          label={m.replay_score_opponent({ opponent: opponentName }, { locale })}
          tone="opponent"
          side={opponent}
          shown={shownSide === "opponent"}
        />
      )}
    </div>
  );
};

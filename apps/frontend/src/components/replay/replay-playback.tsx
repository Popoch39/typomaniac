import type { ReplayedDuel } from "@/api/duel-history";
import { DuelClock } from "@/components/duel/duel-clock";
import { ReplayScores } from "@/components/replay/replay-scores";
import { sidesAt } from "@/components/replay/replay-sides";
import { ReplayText } from "@/components/replay/replay-text";
import { opponentName } from "@/lib/opponent-name";

type ReplayPlaybackProps = { duel: ReplayedDuel; t: number };

// The Duel at `t` ms, as it showed in play: its clock, both Scores, both Runs on its Text. Both
// sides are rebuilt once per instant.
export const ReplayPlayback = ({ duel, t }: ReplayPlaybackProps) => {
  const { own, opponent } = sidesAt(duel, t);

  return (
    <>
      <DuelClock elapsed={t} seconds={duel.seconds} />
      <ReplayScores own={own} opponent={opponent} opponentName={opponentName(duel.opponent)} />
      <ReplayText own={own} opponent={opponent} />
    </>
  );
};

import type { ReplayedDuel } from "@/api/duel-history";
import { DuelClock } from "@/components/duel/duel-clock";
import { ReplayScores } from "@/components/replay/replay-scores";
import { type ReplayView, sidesAt, viewedSides } from "@/components/replay/replay-sides";
import { ReplayText } from "@/components/replay/replay-text";
import { initials } from "@/lib/initials";
import { opponentName } from "@/lib/opponent-name";

type ReplayPlaybackProps = { duel: ReplayedDuel; t: number; view: ReplayView };

// The Duel at `t` ms, as it showed in play: its clock, both Scores, the Run of the side in `view`
// on its Text. Both sides are rebuilt once per instant.
export const ReplayPlayback = ({ duel, t, view }: ReplayPlaybackProps) => {
  const sides = sidesAt(duel, t);
  const { shown, shownSide, caretSide } = viewedSides(sides, view);

  return (
    <>
      <DuelClock elapsed={t} seconds={duel.seconds} />
      <ReplayScores
        own={sides.own}
        opponent={sides.opponent}
        opponentName={opponentName(duel.opponent)}
      />
      <ReplayText
        shown={shown}
        shownSide={shownSide}
        caretSide={caretSide}
        opponentName={opponentName(duel.opponent)}
        opponentInitial={duel.opponent ? initials(duel.opponent.handle) : ""}
      />
    </>
  );
};

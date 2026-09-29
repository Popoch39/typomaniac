import type { ReplayedDuel } from "@/api/duel-history";
import { ReplayScores } from "@/components/replay/replay-scores";
import { type ReplayView, sidesAt, viewedSides } from "@/components/replay/replay-sides";
import { ReplayText } from "@/components/replay/replay-text";
import { initials } from "@/lib/initials";
import { opponentName } from "@/lib/opponent-name";
import { useLocale } from "@/locale/use-locale";

type ReplayPlaybackProps = { duel: ReplayedDuel; t: number; view: ReplayView };

// The Duel at `t` ms, as it showed in play: both Score cards, the Run of the side in `view` on its
// Text. Both sides are rebuilt once per instant.
export const ReplayPlayback = ({ duel, t, view }: ReplayPlaybackProps) => {
  const locale = useLocale();
  const sides = sidesAt(duel, t);
  const { shown, shownSide, caretSide } = viewedSides(sides, view);
  const opponent = opponentName(duel.opponent, locale);

  return (
    <>
      <ReplayScores
        own={sides.own}
        opponent={sides.opponent}
        opponentName={opponent}
        shownSide={shownSide}
      />
      <ReplayText
        shown={shown}
        shownSide={shownSide}
        caretSide={caretSide}
        opponentName={opponent}
        opponentInitial={duel.opponent ? initials(duel.opponent.handle) : ""}
      />
    </>
  );
};

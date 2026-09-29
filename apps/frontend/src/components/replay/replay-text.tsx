import { replayRunName } from "@/components/replay/replay-run-name";
import type { DuelSide, ReplaySide } from "@/components/replay/replay-sides";
import { RunText } from "@/components/run/run-text";
import { initials } from "@/lib/initials";

type ReplayTextProps = {
  shown: ReplaySide;
  shownSide: DuelSide;
  caretSide: ReplaySide | null;
  opponentName: string;
  // The initial over the opponent's caret, when the User's Run shows.
  opponentInitial: string;
};

const otherSideOf = (side: DuelSide): DuelSide => (side === "own" ? "opponent" : "own");

// The Duel's Text in its card as it showed in play: the Run of the side shown, named after it, the
// word of their last Burst, and the other side's caret where their Run stood. Each player keeps
// their colour whatever Run shows.
export const ReplayText = ({
  shown,
  shownSide,
  caretSide,
  opponentName,
  opponentInitial,
}: ReplayTextProps) => {
  const otherSide = otherSideOf(shownSide);

  return (
    <section
      aria-label={replayRunName(shownSide, opponentName)}
      className="rounded-card bg-card px-10 py-7.5"
    >
      <RunText
        run={shown.run}
        tone={shownSide}
        other={
          caretSide === null
            ? null
            : {
                wordIndex: caretSide.run.wordIndex,
                letterIndex: caretSide.run.letterIndex,
                tone: otherSide,
                label: otherSide === "own" ? initials("Toi") : opponentInitial,
              }
        }
        lastBurst={shown.score?.lastBurst ?? null}
      />
    </section>
  );
};

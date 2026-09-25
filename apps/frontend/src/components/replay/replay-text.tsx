import { cn } from "cn";

import { ReplayTextTitle } from "@/components/replay/replay-text-title";
import type { DuelSide, ReplaySide } from "@/components/replay/replay-sides";
import { RunText } from "@/components/run/run-text";
import { initials } from "@/lib/initials";

const tintClassNames: Record<DuelSide, string> = {
  own: "border-caret/40 bg-caret/10",
  opponent: "border-opponent-caret/40 bg-opponent-caret/10",
};

type ReplayTextProps = {
  shown: ReplaySide;
  shownSide: DuelSide;
  caretSide: ReplaySide | null;
  opponentName: string;
  // The initial over the opponent's caret, when the User's Run shows.
  opponentInitial: string;
};

const otherSideOf = (side: DuelSide): DuelSide => (side === "own" ? "opponent" : "own");

// The Duel's Text as it showed in play: the Run of the side shown, the word of their last Burst,
// and the other side's caret where their Run stood. Each player keeps their colour whatever Run
// shows; the title and the tint of the Text say whose it is.
export const ReplayText = ({
  shown,
  shownSide,
  caretSide,
  opponentName,
  opponentInitial,
}: ReplayTextProps) => {
  const otherSide = otherSideOf(shownSide);

  return (
    <section className="flex flex-col gap-2">
      <ReplayTextTitle side={shownSide} opponentName={opponentName} />
      <div className={cn("rounded-card border px-8 py-6", tintClassNames[shownSide])}>
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
      </div>
    </section>
  );
};

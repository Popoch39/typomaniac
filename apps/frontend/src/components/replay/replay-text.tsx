import type { ReplaySide } from "@/components/replay/replay-sides";
import { RunText } from "@/components/run/run-text";

type ReplayTextProps = { shown: ReplaySide; caretSide: ReplaySide | null };

// The Duel's Text as it showed in play: the Run of the side shown, the word of their last Burst,
// and the other side's caret where their Run stood.
export const ReplayText = ({ shown, caretSide }: ReplayTextProps) => (
  <RunText
    run={shown.run}
    opponent={
      caretSide === null
        ? null
        : { wordIndex: caretSide.run.wordIndex, letterIndex: caretSide.run.letterIndex }
    }
    lastBurst={shown.score?.lastBurst ?? null}
  />
);

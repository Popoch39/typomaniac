import type { ReplaySide } from "@/components/replay/replay-sides";
import { RunText } from "@/components/run/run-text";

type ReplayTextProps = { own: ReplaySide; opponent: ReplaySide | null };

// The Duel's Text as it showed in play: the User's Run, the word of their last Burst, and the
// opponent's caret where their Run stood.
export const ReplayText = ({ own, opponent }: ReplayTextProps) => (
  <RunText
    run={own.run}
    opponent={
      opponent === null
        ? null
        : { wordIndex: opponent.run.wordIndex, letterIndex: opponent.run.letterIndex }
    }
    lastBurst={own.score?.lastBurst ?? null}
  />
);

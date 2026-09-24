import { RunText } from "@/components/run/run-text";
import { duelOf, useDuelStore } from "@/stores/duel-store";

// The Duel's Text: this User's Run, and the opponent's caret where their Run stands.
export const DuelText = () => {
  const run = useDuelStore((store) => duelOf(store.state)?.run ?? null);
  const opponentWordIndex = useDuelStore((store) => duelOf(store.state)?.opponentRun.wordIndex);
  const opponentLetterIndex = useDuelStore((store) => duelOf(store.state)?.opponentRun.letterIndex);

  if (
    run === null ||
    typeof opponentWordIndex === "undefined" ||
    typeof opponentLetterIndex === "undefined"
  ) {
    return null;
  }

  return (
    <RunText
      run={run}
      opponent={{ wordIndex: opponentWordIndex, letterIndex: opponentLetterIndex }}
      lastBurst={null}
    />
  );
};

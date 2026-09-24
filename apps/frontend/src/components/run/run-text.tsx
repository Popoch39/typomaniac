import type { RunState } from "typing-engine";

import { RunCaret } from "@/components/run/run-caret";
import { RunWord } from "@/components/run/run-word";
import { type CaretPosition, useTextLayout } from "@/components/run/use-text-layout";

type RunTextProps = {
  run: RunState;
  // In a Duel, where the opponent's caret stands in the same Text.
  opponent: CaretPosition | null;
};

// The Text of a Run, three lines at a time. A keystroke only replaces the current word, so the
// others keep their identity and the React Compiler skips them.
export const RunText = ({ run, opponent }: RunTextProps) => {
  const { words, wordIndex, letterIndex, validatedWords } = run;

  const { scrollRef, wordsRef, caretRef, opponentCaretRef } = useTextLayout(
    { wordIndex, letterIndex },
    opponent,
  );

  return (
    <div className="h-[3lh] overflow-hidden text-2xl leading-relaxed">
      <div ref={scrollRef} className="relative">
        {opponent === null ? null : <RunCaret ref={opponentCaretRef} tone="opponent" />}
        <RunCaret ref={caretRef} tone="own" />
        <div ref={wordsRef} className="flex flex-wrap gap-x-[1ch]">
          {/* Not wordIndex: the caret stays on the last word once it is validated. */}
          {words.map((word) => (
            <RunWord key={word.index} word={word} validated={word.index < validatedWords} />
          ))}
        </div>
      </div>
    </div>
  );
};

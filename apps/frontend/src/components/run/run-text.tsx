import type { RunState } from "typing-engine";

import { RunCaret } from "@/components/run/run-caret";
import type { RunTone } from "@/components/run/run-tone";
import { RunWord } from "@/components/run/run-word";
import { type CaretPosition, useTextLayout } from "@/components/run/use-text-layout";

// The other player's caret in the same Text: where it stands, their colour and their initial.
export type OtherCaret = CaretPosition & { tone: RunTone; label: string };

type RunTextProps = {
  run: RunState;
  // Whose Run it is: the colour of its caret and of its last Burst.
  tone: RunTone;
  // In a Duel, the caret of the other player; null when alone on the Text.
  other: OtherCaret | null;
  // The index of the word of the last Burst, highlighted; null when there is none.
  lastBurst: number | null;
};

// The Text of a Run, three lines at a time. A keystroke only replaces the current word, so the
// others keep their identity and the React Compiler skips them.
export const RunText = ({ run, tone, other, lastBurst }: RunTextProps) => {
  const { words, wordIndex, letterIndex, validatedWords } = run;

  const { scrollRef, wordsRef, caretRef, opponentCaretRef } = useTextLayout(
    { wordIndex, letterIndex },
    other,
  );

  return (
    <div className="h-[3lh] overflow-hidden text-2xl leading-relaxed">
      <div ref={scrollRef} className="relative">
        {other === null ? null : (
          <RunCaret ref={opponentCaretRef} tone={other.tone} label={other.label} />
        )}
        <RunCaret ref={caretRef} tone={tone} />
        <div ref={wordsRef} className="flex flex-wrap gap-x-[1ch]">
          {/* Not wordIndex: the caret stays on the last word once it is validated. */}
          {words.map((word) => (
            <RunWord
              key={word.index}
              word={word}
              validated={word.index < validatedWords}
              burst={word.index === lastBurst ? tone : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

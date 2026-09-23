import { RunCaret } from "@/components/run/run-caret";
import { RunWord } from "@/components/run/run-word";
import { useTextLayout } from "@/components/run/use-text-layout";
import { useRunStore } from "@/stores/run-store";

// The Text of the Run, three lines at a time. A keystroke only replaces the current word, so the
// others keep their identity and the React Compiler skips them.
export const RunText = () => {
  const words = useRunStore((state) => state.run.words);
  const wordIndex = useRunStore((state) => state.run.wordIndex);
  const letterIndex = useRunStore((state) => state.run.letterIndex);
  // Not wordIndex: the caret stays on the last word once it is validated.
  const validatedWords = useRunStore((state) => state.run.validatedWords);
  const { scrollRef, wordsRef, caretRef } = useTextLayout(wordIndex, letterIndex);

  return (
    <div className="h-[3lh] overflow-hidden text-2xl leading-relaxed">
      <div ref={scrollRef} className="relative">
        <RunCaret ref={caretRef} />
        <div ref={wordsRef} className="flex flex-wrap gap-x-[1ch]">
          {words.map((word) => (
            <RunWord key={word.index} word={word} validated={word.index < validatedWords} />
          ))}
        </div>
      </div>
    </div>
  );
};

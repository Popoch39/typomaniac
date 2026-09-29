import type { RunWord as Word } from "typing-engine";

import { displayedStatus, isTypedWrong, isWrongWord } from "@/components/run/displayed-status";
import type { RunTone } from "@/components/run/run-tone";
import { WrongWordWaves } from "@/components/run/wrong-word-waves";

type RunWordProps = {
  word: Word;
  // True once the word is validated by space (or typed right, for the last one).
  validated: boolean;
  // For the word of the last Burst, highlighted until the next one: the colour of whose Run it is.
  burst: RunTone | null;
};

// One word of the Text, each letter colored by its status (`data-status`), a skipped one in red like
// a wrong one. A Wrong word (`data-wrong`) has its mistakes underlined with the Logo's wave; a word
// typed wrong but not validated holds its waves too, hidden, to take them back when backspace
// reopens it.
export const RunWord = ({ word, validated, burst }: RunWordProps) => {
  const wrong = isWrongWord(word, validated);

  return (
    <span
      data-word={word.index}
      data-burst={burst !== null}
      data-tone={burst ?? undefined}
      data-wrong={wrong ? "" : undefined}
      className="relative -mx-[0.25ch] px-[0.25ch] transition-colors duration-300 data-[tone=opponent]:bg-opponent-caret/20 data-[tone=own]:bg-caret/20"
    >
      {word.letters.map((letter) => (
        <span
          key={letter.index}
          data-status={displayedStatus(letter, validated)}
          className="text-muted-foreground data-[status=correct]:text-foreground data-[status=extra]:text-destructive/60 data-[status=incorrect]:text-destructive data-[status=missed]:text-destructive"
        >
          {letter.char}
        </span>
      ))}
      {isTypedWrong(word) ? (
        // From the first letter, inside the word's padding, and at the canvas's place: 1.33em from
        // the top of the Run's 1.625 line, under the baseline.
        <WrongWordWaves
          word={word}
          drawn={wrong}
          className="top-[calc(50%_+_0.52em)] left-[0.25ch]"
        />
      ) : null}
    </span>
  );
};

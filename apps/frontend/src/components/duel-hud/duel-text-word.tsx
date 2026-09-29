import { cn } from "cn";
import type { RunWord } from "typing-engine";

import { displayedStatus, isTypedWrong, isWrongWord } from "@/components/run/displayed-status";
import { WrongWordWave } from "@/components/run/wrong-word-wave";

type DuelTextWordProps = {
  word: RunWord;
  // True once the word is validated by space.
  validated: boolean;
  // True for the word of this User's last Burst, highlighted until the next one.
  burst: boolean;
};

// One word of the Duel's Text, each letter coloured by its status (`data-status`), a skipped one in
// red like a wrong one. The word of the last Burst is highlighted in the accent, at `--burst` of its
// strength (all of it for that word, none for the others): what GSAP moves to bring it in, and to
// take it off the word before. A Wrong word (`data-wrong`) is underlined with the Logo's wave, over
// the highlight; a word typed wrong but not validated holds its wave too, hidden, as in the Run.
export const DuelTextWord = ({ word, validated, burst }: DuelTextWordProps) => {
  const wrong = isWrongWord(word, validated);

  return (
    <span
      data-word={word.index}
      data-burst={burst ? "" : undefined}
      data-wrong={wrong ? "" : undefined}
      className={cn(
        "relative -mx-[0.22ch] inline-flex rounded-[6px] bg-[color-mix(in_srgb,var(--color-brand)_calc(var(--burst)*22%),transparent)] px-[0.22ch]",
        burst ? "[--burst:1]" : "[--burst:0]",
      )}
    >
      {word.letters.map((letter) => (
        <span
          key={letter.index}
          data-status={displayedStatus(letter, validated)}
          className="text-pending data-[status=correct]:text-foreground data-[status=extra]:text-destructive/60 data-[status=incorrect]:text-destructive data-[status=missed]:text-destructive"
        >
          {letter.char}
        </span>
      ))}
      {isTypedWrong(word) ? (
        // Across the letters, inside the word's padding, and at the board's place: 1.29em from the
        // top of its 1.8em row, the word's 1.3 line centred in it.
        <WrongWordWave
          letters={word.letters.length}
          drawn={wrong}
          className="top-[calc(50%_+_0.39em)] left-[0.22ch] w-[calc(100%_-_0.44ch)]"
        />
      ) : null}
    </span>
  );
};

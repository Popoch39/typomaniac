import type { RunWord } from "typing-engine";

import { DuelTextWord } from "@/components/duel-hud/duel-text-word";

type DuelTextRowProps = {
  words: readonly RunWord[];
  // How many words of the Run are validated.
  validatedWords: number;
  // The index of the word of the last Burst; null when there is none.
  lastBurst: number | null;
};

// One row of the Duel's Text: its words on a single line, 1ch apart.
export const DuelTextRow = ({ words, validatedWords, lastBurst }: DuelTextRowProps) => (
  <div data-text-row className="flex h-[1.8em] items-center gap-x-[1ch] whitespace-nowrap">
    {words.map((word) => (
      <DuelTextWord
        key={word.index}
        word={word}
        validated={word.index < validatedWords}
        burst={word.index === lastBurst}
      />
    ))}
  </div>
);

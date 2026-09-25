import type { Letter, RunWord as Word } from "typing-engine";

import type { RunTone } from "@/components/run/run-tone";

// A letter still pending once its word is validated was skipped: it shows as missed. The engine
// has no such status, `missed` only exists on screen.
const displayedStatus = (letter: Letter, validated: boolean) =>
  validated && letter.status === "pending" ? "missed" : letter.status;

type RunWordProps = {
  word: Word;
  // True once the word is validated by space (or typed right, for the last one).
  validated: boolean;
  // For the word of the last Burst, highlighted until the next one: the colour of whose Run it is.
  burst: RunTone | null;
};

// One word of the Text, each letter colored by its status (`data-status`).
export const RunWord = ({ word, validated, burst }: RunWordProps) => (
  <span
    data-burst={burst !== null}
    data-tone={burst ?? undefined}
    className="-mx-[0.25ch] px-[0.25ch] transition-colors duration-300 data-[tone=opponent]:bg-opponent-caret/20 data-[tone=own]:bg-caret/20"
  >
    {word.letters.map((letter) => (
      <span
        key={letter.index}
        data-status={displayedStatus(letter, validated)}
        className="text-muted-foreground data-[status=correct]:text-foreground data-[status=extra]:text-destructive/60 data-[status=incorrect]:text-destructive data-[status=missed]:underline data-[status=missed]:decoration-destructive"
      >
        {letter.char}
      </span>
    ))}
  </span>
);

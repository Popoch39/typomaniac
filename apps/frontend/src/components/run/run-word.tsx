import type { Letter, RunWord as Word } from "typing-engine";

// A letter still pending once its word is validated was skipped: it shows as missed. The engine
// has no such status, `missed` only exists on screen.
const displayedStatus = (letter: Letter, validated: boolean) =>
  validated && letter.status === "pending" ? "missed" : letter.status;

// One word of the Text, each letter colored by its status (`data-status`). `validated` is true
// once the word is validated by space (or typed right, for the last one).
export const RunWord = ({ word, validated }: { word: Word; validated: boolean }) => (
  <span>
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

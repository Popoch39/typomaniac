import type { RunWord as Word } from "typing-engine";

// One word of the Text, each letter colored by its status (`data-status`).
export const RunWord = ({ word }: { word: Word }) => (
  <span>
    {word.letters.map((letter) => (
      <span
        key={letter.index}
        data-status={letter.status}
        className="text-muted-foreground data-[status=correct]:text-foreground data-[status=extra]:text-destructive/60 data-[status=incorrect]:text-destructive"
      >
        {letter.char}
      </span>
    ))}
  </span>
);

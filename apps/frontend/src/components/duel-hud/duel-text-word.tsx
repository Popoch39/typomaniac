import { cn } from "cn";
import type { RunWord } from "typing-engine";

import { displayedStatus } from "@/components/run/displayed-status";

type DuelTextWordProps = {
  word: RunWord;
  // True once the word is validated by space.
  validated: boolean;
  // True for the word of this User's last Burst, highlighted until the next one.
  burst: boolean;
};

// One word of the Duel's Text, each letter coloured by its status (`data-status`). The word of the
// last Burst is highlighted in the accent, at `--burst` of its strength (all of it by default):
// what GSAP moves to bring it in.
export const DuelTextWord = ({ word, validated, burst }: DuelTextWordProps) => (
  <span
    data-word={word.index}
    data-burst={burst ? "" : undefined}
    className={cn(
      "-mx-[0.22ch] inline-flex rounded-[6px] px-[0.22ch]",
      burst && "bg-[color-mix(in_srgb,var(--color-brand)_calc(var(--burst,1)*22%),transparent)]",
    )}
  >
    {word.letters.map((letter) => (
      <span
        key={letter.index}
        data-status={displayedStatus(letter, validated)}
        className="text-pending data-[status=correct]:text-foreground data-[status=extra]:text-destructive/60 data-[status=incorrect]:text-destructive data-[status=missed]:underline data-[status=missed]:decoration-destructive"
      >
        {letter.char}
      </span>
    ))}
  </span>
);

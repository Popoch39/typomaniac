import { cn } from "cn";

import type { LetterRun } from "@/components/run/displayed-status";
import { wavePath } from "@/components/run/wave-path";

type WrongWordWaveProps = {
  // The mistakes it underlines: letters that follow each other.
  run: LetterRun;
  // True on a Wrong word; false on a word still being typed, reopened ones included.
  drawn: boolean;
  // Its place in the word's box: at its first letter, under their baseline.
  className: string;
};

// The Logo's wave under a run of a Wrong word's mistakes, in the Theme's error red (a class:
// `var()` does not work in an SVG presentation attribute), stretched across its letters (1ch
// each, from its first one on), its stroke kept as thick. `--wave` is how much of it shows, from
// the left: all of it on a Wrong word, none on the others, what `useWrongWordWave` moves in
// between (`data-wave`). A drawing only.
export const WrongWordWave = ({ run, drawn, className }: WrongWordWaveProps) => (
  <svg
    data-wave
    viewBox={`0 0 ${run.letters} 1`}
    preserveAspectRatio="none"
    fill="none"
    aria-hidden="true"
    style={{ marginLeft: `${run.start}ch`, width: `${run.letters}ch` }}
    className={cn(
      "pointer-events-none absolute h-[0.18em] overflow-visible [clip-path:inset(-0.1em_calc((1_-_var(--wave))_*_100%)_-0.1em_-0.1em)]",
      drawn ? "[--wave:1]" : "[--wave:0]",
      className,
    )}
  >
    <path
      d={wavePath(run.letters)}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      className="stroke-destructive [stroke-width:0.1em]"
    />
  </svg>
);

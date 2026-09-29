import { cn } from "cn";

import { wavePath } from "@/components/run/wave-path";

type WrongWordWaveProps = {
  // The word's letters, extra ones included.
  letters: number;
  // True on a Wrong word; false on a word still being typed, reopened ones included.
  drawn: boolean;
  // Its place in the word's box: across its letters, under their baseline.
  className: string;
};

// The Logo's wave under a Wrong word, in the Theme's error red (a class: `var()` does not work in
// an SVG presentation attribute), stretched across the word, its stroke kept as thick. `--wave` is
// how much of it shows, from the left: all of it on a Wrong word, none on the others. A drawing
// only.
export const WrongWordWave = ({ letters, drawn, className }: WrongWordWaveProps) => (
  <svg
    viewBox={`0 0 ${letters} 1`}
    preserveAspectRatio="none"
    fill="none"
    aria-hidden="true"
    className={cn(
      "pointer-events-none absolute h-[0.18em] overflow-visible [clip-path:inset(-0.1em_calc((1_-_var(--wave))_*_100%)_-0.1em_-0.1em)]",
      drawn ? "[--wave:1]" : "[--wave:0]",
      className,
    )}
  >
    <path
      d={wavePath(letters)}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      className="stroke-destructive [stroke-width:0.1em]"
    />
  </svg>
);

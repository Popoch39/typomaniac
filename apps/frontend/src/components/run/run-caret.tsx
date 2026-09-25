import type { Ref } from "react";

import { cn } from "cn";

import type { RunTone } from "@/components/run/run-tone";

const toneClassNames: Record<RunTone, string> = {
  own: "bg-caret",
  // In a Duel, the opponent's caret in the same Text: another colour, never mistaken for one's own.
  opponent: "bg-opponent-caret",
};

type RunCaretProps = {
  ref: Ref<HTMLSpanElement>;
  tone: RunTone;
  // The initial of the other player, over their caret; none on the caret of the Run shown.
  label?: string;
};

// A typing caret, moved by `transform`. It glides from letter to letter, unless the user asked
// for reduced motion.
export const RunCaret = ({ ref, tone, label }: RunCaretProps) => (
  <span
    ref={ref}
    aria-hidden
    data-caret={tone}
    className={cn(
      "absolute top-[0.15lh] left-0 h-[0.7lh] w-0.5 -translate-x-1/2 rounded-full transition-transform duration-100 ease-out motion-reduce:transition-none",
      toneClassNames[tone],
    )}
  >
    {typeof label === "undefined" ? null : (
      <span
        className={cn(
          "absolute top-full left-1/2 mt-px -translate-x-1/2 rounded-sm px-0.5 text-[0.55rem] leading-tight font-bold text-background",
          toneClassNames[tone],
        )}
      >
        {label}
      </span>
    )}
  </span>
);

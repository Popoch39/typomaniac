import type { Ref } from "react";

import { cn } from "cn";

const toneClassNames = {
  own: "bg-caret",
  // In a Duel, the opponent's caret in the same Text: another colour, never mistaken for one's own.
  opponent: "bg-opponent-caret",
};

type RunCaretProps = { ref: Ref<HTMLSpanElement>; tone: keyof typeof toneClassNames };

// A typing caret, moved by `transform`. It glides from letter to letter, unless the user asked
// for reduced motion.
export const RunCaret = ({ ref, tone }: RunCaretProps) => (
  <span
    ref={ref}
    aria-hidden
    data-caret={tone}
    className={cn(
      "absolute top-[0.15lh] left-0 h-[0.7lh] w-0.5 -translate-x-1/2 rounded-full transition-transform duration-100 ease-out motion-reduce:transition-none",
      toneClassNames[tone],
    )}
  />
);

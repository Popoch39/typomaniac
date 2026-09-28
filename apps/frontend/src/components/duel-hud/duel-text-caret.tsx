import type { Ref } from "react";

import { cn } from "cn";

import type { RunTone } from "@/components/run/run-tone";

const toneClassNames: Record<RunTone, string> = {
  own: "bg-caret",
  opponent: "bg-opponent-caret",
};

type DuelTextCaretProps = {
  ref: Ref<HTMLSpanElement>;
  tone: RunTone;
  // The opponent's initials, under their caret; none on this User's.
  label: string | null;
  hidden: boolean;
};

// A block caret of the Duel's Text, moved by GSAP to the letter it stands before.
export const DuelTextCaret = ({ ref, tone, label, hidden }: DuelTextCaretProps) => (
  <span
    ref={ref}
    aria-hidden
    data-caret={tone}
    hidden={hidden}
    className={cn(
      "absolute top-[0.1em] -left-[2px] h-[1.1em] w-[5px] rounded-[2px] will-change-transform",
      toneClassNames[tone],
    )}
  >
    {label === null ? null : (
      <span
        className={cn(
          "absolute top-[calc(100%+2px)] left-1/2 -translate-x-1/2 rounded-[4px] px-1 py-px font-sans text-[12px] leading-[1.2] font-extrabold text-background",
          toneClassNames[tone],
        )}
      >
        {label}
      </span>
    )}
  </span>
);

import { cn } from "cn";

import { DIGITS, digitName } from "@/components/face-off/face-off-timeline";

const MARK =
  "invisible absolute inset-0 flex items-center justify-center leading-none text-foreground opacity-0";

// The ink disc on the diagonal's middle, over both panels: the VS of the impact, then the 3-2-1
// and GO, each shown in turn by the timeline. Seen only: the announcer says them.
export const FaceOffCount = () => (
  <div
    aria-hidden
    data-face-off="disc"
    className="pointer-events-none invisible absolute inset-0 m-auto size-50 rounded-full bg-background opacity-0 ring-12 ring-background/25"
  >
    <span data-face-off="vs" className={cn(MARK, "text-[4rem] font-extrabold italic")}>
      VS
    </span>
    {DIGITS.map(({ mark }) => (
      <span
        key={mark}
        data-face-off={digitName(mark)}
        className={cn(MARK, "font-mono text-[6.875rem] font-semibold tabular-nums")}
      >
        {mark}
      </span>
    ))}
    <span
      data-face-off="go"
      className={cn(MARK, "text-[4.75rem] font-extrabold text-caret italic")}
    >
      GO
    </span>
  </div>
);

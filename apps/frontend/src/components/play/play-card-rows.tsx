import type { ReactNode } from "react";

type PlayCardRowsProps = {
  // What screen readers hear of the list.
  label: string;
  // Its rows, three at most, each an `li` of one line.
  children: ReactNode;
};

// A list of a card's live zone, which takes the height left in it and keeps only the rows that fit
// whole: the third goes first, then the second (`play-rows-fit-*`, out of the tab order too).
// Each row is one line of 1.75rem, 0.5rem apart, as the variants count them.
export const PlayCardRows = ({ label, children }: PlayCardRowsProps) => (
  <ul
    aria-label={label}
    className="flex min-h-0 w-full flex-1 flex-col gap-2 [container:play-rows_/_size] *:flex *:h-7 *:shrink-0 *:items-center *:whitespace-nowrap *:nth-[n+2]:play-rows-fit-1:hidden *:nth-[n+3]:play-rows-fit-2:hidden"
  >
    {children}
  </ul>
);

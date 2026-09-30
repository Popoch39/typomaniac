import type { ReactNode } from "react";

type DuelEndTapeNameProps = { children: ReactNode; title?: string };

// A line's name, in its pill between both players' values: the header of its row.
export const DuelEndTapeName = ({ children, title }: DuelEndTapeNameProps) => (
  <th scope="row" className="font-normal">
    <span
      title={title}
      className="rounded-full bg-surface-2 px-3.5 py-1.5 font-display text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase"
    >
      {children}
    </span>
  </th>
);

import type { ReactNode } from "react";

type StatTileProps = { term: string; children: ReactNode };

// One of the Stats: its name, then its value.
export const StatTile = ({ term, children }: StatTileProps) => (
  <div className="flex flex-col gap-1 border border-border p-3">
    <dt className="text-[0.7rem] text-muted-foreground">{term}</dt>
    <dd className="text-xl text-caret font-mono tabular-nums">{children}</dd>
  </div>
);

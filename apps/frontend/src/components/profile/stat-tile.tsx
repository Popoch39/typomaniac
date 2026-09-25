import type { ReactNode } from "react";

type StatTileProps = { term: string; children: ReactNode };

// One of the Stats, on its own card: its name, then its value in the accent.
export const StatTile = ({ term, children }: StatTileProps) => (
  <div className="flex flex-col gap-1 rounded-card bg-card px-5 py-4">
    <dt className="text-xs text-muted-foreground">{term}</dt>
    <dd className="text-2xl font-semibold text-caret font-mono tabular-nums">{children}</dd>
  </div>
);

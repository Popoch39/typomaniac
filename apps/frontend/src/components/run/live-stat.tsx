import type { ReactNode } from "react";

// One statistic shown while typing: its name, then its value.
export const LiveStat = ({ term, children }: { term: string; children: ReactNode }) => (
  <div className="flex items-baseline gap-2">
    <dt className="text-sm text-muted-foreground">{term}</dt>
    <dd className="text-xl text-caret tabular-nums">{children}</dd>
  </div>
);

import type { ReactNode } from "react";

import { cn } from "cn";

type ReplayStatProps = { term: string; children: ReactNode; className?: string };

// One figure of a Score card of the Replay: its name, then its value under it, both flush right.
export const ReplayStat = ({ term, children, className }: ReplayStatProps) => (
  <div className="flex flex-col items-end gap-0.5">
    <dt className="text-xs text-muted-foreground">{term}</dt>
    <dd className={cn("font-mono text-[22px] font-semibold tabular-nums", className)}>
      {children}
    </dd>
  </div>
);

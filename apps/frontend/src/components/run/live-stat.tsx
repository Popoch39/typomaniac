import type { ReactNode } from "react";

import { cn } from "cn";

const toneClassNames = {
  own: "text-caret",
  opponent: "text-opponent-caret",
  // Something just went wrong, e.g. a broken Combo.
  broken: "text-destructive",
};

type LiveStatProps = {
  term: string;
  children: ReactNode;
  // Whose it is, this User's or the opponent's in a Duel, unless it just went wrong.
  tone?: keyof typeof toneClassNames;
};

// One statistic shown while typing: its name, then its value under it, both flush right.
export const LiveStat = ({ term, children, tone = "own" }: LiveStatProps) => (
  <div className="flex flex-col items-end gap-0.5">
    <dt className="text-xs text-muted-foreground">{term}</dt>
    <dd
      className={cn(
        "font-mono text-xl font-semibold tabular-nums transition-colors",
        toneClassNames[tone],
      )}
    >
      {children}
    </dd>
  </div>
);

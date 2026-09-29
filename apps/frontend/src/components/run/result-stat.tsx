import type { ReactNode } from "react";

import type { RunTone } from "@/components/run/run-tone";

const valueClassNames = {
  main: "text-5xl",
  secondary: "text-2xl",
};

const toneClassNames: Record<RunTone, string> = {
  own: "text-caret",
  opponent: "text-opponent-caret",
};

type ResultStatProps = {
  term: string;
  children: ReactNode;
  // `main` for the headline stats, `secondary` for the details.
  size: keyof typeof valueClassNames;
  // Whose Result it is: the User's in the accent, an opponent's in their colour.
  tone?: RunTone;
  // What the value is made of, shown on hover.
  description?: string;
};

// One statistic of a Result: its name, then its value.
export const ResultStat = ({
  term,
  children,
  size,
  tone = "own",
  description,
}: ResultStatProps) => (
  <div className="flex flex-col gap-1">
    <dt className="text-sm font-semibold text-muted-foreground">{term}</dt>
    <dd
      title={description}
      className={`${toneClassNames[tone]} font-mono tabular-nums ${valueClassNames[size]}`}
    >
      {children}
    </dd>
  </div>
);

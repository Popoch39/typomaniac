import type { ReactNode } from "react";

const valueClassNames = {
  main: "text-5xl",
  secondary: "text-2xl",
};

type ResultStatProps = {
  term: string;
  children: ReactNode;
  // `main` for the headline stats, `secondary` for the details.
  size: keyof typeof valueClassNames;
  // What the value is made of, shown on hover.
  description?: string;
};

// One statistic of a Result: its name, then its value.
export const ResultStat = ({ term, children, size, description }: ResultStatProps) => (
  <div className="flex flex-col gap-1">
    <dt className="text-sm font-semibold text-muted-foreground">{term}</dt>
    <dd
      title={description}
      className={`text-caret font-mono tabular-nums ${valueClassNames[size]}`}
    >
      {children}
    </dd>
  </div>
);

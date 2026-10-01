import { cn } from "cn";

type HistoryTallyFigureProps = { term: string; value: string; className?: string };

// A figure of the week's tally, large, its name under it.
export const HistoryTallyFigure = ({ term, value, className }: HistoryTallyFigureProps) => (
  <div className="flex flex-col-reverse gap-1">
    <dt className="text-[13px] text-muted-foreground">{term}</dt>
    <dd className={cn("m-0 text-4xl font-extrabold", className)}>{value}</dd>
  </div>
);

import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

// The way the wpm went over the window, before its figure: up, down, or flat. Only seen, the figure
// says it.
export const WpmTrendArrow = ({ trend }: { trend: number }) => {
  if (trend > 0) {
    return <ArrowUpIcon aria-hidden strokeWidth={3} className="size-3.5" />;
  }

  return trend < 0 ? (
    <ArrowDownIcon aria-hidden strokeWidth={3} className="size-3.5" />
  ) : (
    <MinusIcon aria-hidden strokeWidth={3} className="size-3.5" />
  );
};

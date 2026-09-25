import { cn } from "cn";

// The TP a ranked Duel moved, signed, popping in.
export const TpDelta = ({ tp }: { tp: number }) => (
  <p
    className={cn(
      "font-mono text-4xl font-bold tabular-nums motion-safe:animate-tp-pop",
      tp >= 0 ? "text-primary" : "text-muted-foreground",
    )}
  >
    {`${tp >= 0 ? "+" : "−"}${Math.abs(tp)} TP`}
  </p>
);

import { DIVISION_TP } from "ranked";

// The TP of the Division out of 100: the TP before the Duel stays faint behind the bar that
// fills up to the TP after it. Maniac has no cap, so no bar.
export const TpBar = ({ before, after }: { before: number; after: number }) => (
  <div className="relative h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
    <span
      className="absolute inset-y-0 left-0 rounded-full bg-foreground/15"
      style={{ width: `${Math.min(before, DIVISION_TP)}%` }}
    />
    <span
      className="absolute inset-y-0 left-0 origin-left rounded-full bg-primary motion-safe:animate-tp-fill"
      style={{ width: `${Math.min(after, DIVISION_TP)}%` }}
    />
  </div>
);

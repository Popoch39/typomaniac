import type { ReactNode } from "react";

type DuelHistoryColumnsProps = { list: ReactNode; details: ReactNode };

// The Duels page's two columns: the Duel history, 520 px at the left, then the chosen Duel on the
// width left, kept in view while the list scrolls.
export const DuelHistoryColumns = ({ list, details }: DuelHistoryColumnsProps) => (
  <div className="flex items-start gap-6">
    <div className="flex w-130 shrink-0 flex-col gap-3">{list}</div>
    <div className="sticky top-9 min-w-0 flex-1">{details}</div>
  </div>
);

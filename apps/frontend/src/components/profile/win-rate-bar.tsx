import { cn } from "cn";

import type { Stats } from "@/api/profile";
import { OUTCOME_PAINT } from "@/components/profile/profile-card-paint";

type WinRateBarProps = { record: Stats["record"]; duels: number };

// The wins, the Draws, then the losses, side by side on one bar, each as wide as its share. Only
// seen: the legend under it says the same in words.
export const WinRateBar = ({ record, duels }: WinRateBarProps) => (
  <div aria-hidden className="flex h-3 gap-0.75 overflow-hidden rounded-md">
    {record.wins > 0 ? (
      <span
        className={cn("rounded-xs", OUTCOME_PAINT.wins)}
        style={{ width: `${(record.wins / duels) * 100}%` }}
      />
    ) : null}
    {record.draws > 0 ? (
      <span
        className={cn("rounded-xs", OUTCOME_PAINT.draws)}
        style={{ width: `${(record.draws / duels) * 100}%` }}
      />
    ) : null}
    {record.losses > 0 ? <span className={cn("flex-1 rounded-xs", OUTCOME_PAINT.losses)} /> : null}
  </div>
);

import type { ComponentProps, ReactNode } from "react";

import { useLockSecondsLeft } from "@/components/duel/use-lock-seconds-left";
import type { Clock } from "@/components/run/clock-context";
import { Button } from "@/components/ui/button";
import { lockTimeLeftLabel } from "@/lib/queue-lock";

type QueueLockButtonProps = {
  // The end of the Queue lock, on the tab's clock; null without one.
  lockedUntil: number | null;
  // The clock the lock is told on, where it is not the tab's.
  clock?: Clock;
  onClick: () => void;
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  children: ReactNode;
};

// A button that joins the Queue: disabled while the Queue lock lasts, with the time left, and open
// again on its own once it is over, without sending anything.
export const QueueLockButton = ({
  lockedUntil,
  clock,
  onClick,
  size,
  className,
  children,
}: QueueLockButtonProps) => {
  const left = useLockSecondsLeft(lockedUntil, clock);

  return (
    <Button onClick={onClick} disabled={left > 0} size={size} className={className}>
      {children}
      {left > 0 ? <span className="font-mono tabular-nums">{lockTimeLeftLabel(left)}</span> : null}
    </Button>
  );
};

import type { ReactNode } from "react";

type EmptyStateProps = { title: string; reason: ReactNode; action?: ReactNode };

// A list with nothing in it: why it is empty, and what to do to fill it.
export const EmptyState = ({ title, reason, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
    <p className="font-semibold">{title}</p>
    <p className="max-w-sm text-sm text-muted-foreground">{reason}</p>
    {action}
  </div>
);

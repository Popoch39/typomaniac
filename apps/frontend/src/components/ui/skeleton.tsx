import { cn } from "cn";
import type { ComponentProps } from "react";

// A block standing in for content that is loading, pulsing at its size. Hidden from assistive tech:
// the loading region around it says what loads.
export const Skeleton = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    aria-hidden
    data-slot="skeleton"
    className={cn("animate-pulse rounded-xl bg-surface-2", className)}
    {...props}
  />
);

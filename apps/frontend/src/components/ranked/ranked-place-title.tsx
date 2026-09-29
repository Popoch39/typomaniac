import { cn } from "cn";
import type { ReactNode } from "react";

type RankedPlaceTitleProps = { className?: string; children: ReactNode };

// The reader's rank in « Ta place », in large: "Or II" in the Tier's colour.
export const RankedPlaceTitle = ({ className, children }: RankedPlaceTitleProps) => (
  <p className={cn("text-[64px] leading-none font-extrabold tracking-[-0.045em]", className)}>
    {children}
  </p>
);

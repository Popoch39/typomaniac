import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

// A part of the Friends page while it loads: its small title, then its own Skeleton.
export const TitledSkeleton = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-2.5">
    <Skeleton className="h-4 w-44" />
    {children}
  </div>
);

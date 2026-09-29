import { cn } from "cn";
import type { ReactNode } from "react";

import { STAT_TILE_PAINT } from "@/components/profile/profile-paint";

type StatTileProps = { term: string; children: ReactNode };

// One of the Stats, on its own card: its name, then its value in the accent.
export const StatTile = ({ term, children }: StatTileProps) => (
  <div className={cn("flex flex-col gap-1 px-4 py-3.5", STAT_TILE_PAINT)}>
    <dt className="text-xs text-muted-foreground">{term}</dt>
    <dd className="font-mono text-[22px] font-semibold text-caret tabular-nums">{children}</dd>
  </div>
);

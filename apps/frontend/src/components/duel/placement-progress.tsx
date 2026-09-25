import { PLACEMENT_DUELS } from "ranked";

import { cn } from "cn";

// A Placement Duel: how many are left before the rank shows, one dot per Placement Duel.
export const PlacementProgress = ({ placementsLeft }: { placementsLeft: number }) => (
  <div className="flex flex-col gap-3">
    <p className="text-lg font-semibold">
      {placementsLeft === 1
        ? "Placement : encore 1 Duel avant ton rang"
        : `Placement : encore ${placementsLeft} Duels avant ton rang`}
    </p>
    <div className="flex gap-2" aria-hidden>
      {Array.from({ length: PLACEMENT_DUELS }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-3 rounded-full",
            index < PLACEMENT_DUELS - placementsLeft ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </div>
  </div>
);

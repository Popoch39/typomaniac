import { isPlacement, PLACEMENT_DUELS, type Rank } from "ranked";

import { rankLabel } from "@/components/tier/rank/rank-label";
import { TpProgress } from "@/components/tier/rank/tp-progress";
import { useLocale } from "@/locale/use-locale";

// A reader not in the Classement yet, in Placement or without a Rating: what gets them in, and the
// Placement Duels they have played.
export const LeaderboardPlacePending = ({ rank }: { rank: Rank | null }) => {
  const locale = useLocale();

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-xl font-bold">Termine ton Placement</p>
        <p className="text-[13px] text-muted-foreground">
          Tes {PLACEMENT_DUELS} Duels de Placement te font entrer au Classement.
        </p>
      </div>
      {rank !== null && isPlacement(rank) ? (
        <div className="flex flex-col gap-2">
          <TpProgress rank={rank} size="lg" />
          <p className="text-[13px] text-muted-foreground">{rankLabel(rank, locale)}</p>
        </div>
      ) : null}
    </>
  );
};

import { useId } from "react";

import type { DuelHistoryEntry } from "@/api/duel-history";
import { DuelDetailsCard } from "@/components/duel-history/duel-details-card";
import { DuelDetailsHeader } from "@/components/duel-history/duel-details-header";
import { DuelDetailsLoader } from "@/components/duel-history/duel-details-loader";

// The chosen Duel beside the Duel history, named by how it ended: at once what its line knew
// (outcome, opponent, date, kind, TP), then what the Duel itself tells, as it loads.
export const DuelDetails = ({ duel }: { duel: DuelHistoryEntry }) => {
  const titleId = useId();

  return (
    <DuelDetailsCard titleId={titleId}>
      <DuelDetailsHeader duel={duel} titleId={titleId} />
      <DuelDetailsLoader duelId={duel.id} />
    </DuelDetailsCard>
  );
};

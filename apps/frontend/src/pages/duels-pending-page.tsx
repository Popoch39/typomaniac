import { DuelDetailsCard } from "@/components/duel-history/duel-details-card";
import { DuelDetailsSkeleton } from "@/components/duel-history/duel-details-skeleton";
import { DuelHistoryColumns } from "@/components/duel-history/duel-history-columns";
import { DuelHistorySkeleton } from "@/components/duel-history/duel-history-skeleton";
import { DuelsHeader } from "@/components/duel-history/duels-header";

// The Duels page while its first page of the Duel history loads: the list and the chosen Duel in
// their columns.
export const DuelsPendingPage = () => (
  <section className="flex flex-col gap-6">
    <DuelsHeader />
    <DuelHistoryColumns
      list={<DuelHistorySkeleton />}
      details={
        <DuelDetailsCard>
          <DuelDetailsSkeleton />
        </DuelDetailsCard>
      }
    />
  </section>
);

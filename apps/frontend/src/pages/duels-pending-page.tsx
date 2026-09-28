import { DuelHistorySkeleton } from "@/components/duel-history/duel-history-skeleton";
import { DuelsHeader } from "@/components/duel-history/duels-header";

// The Duels page while its first page of the Duel history loads.
export const DuelsPendingPage = () => (
  <section className="flex flex-col gap-6">
    <DuelsHeader />
    <div className="w-full max-w-2xl">
      <DuelHistorySkeleton />
    </div>
  </section>
);

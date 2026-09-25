import { DuelHistorySkeleton } from "@/components/duel-history/duel-history-skeleton";

// The Duels page while its first page of the Duel history loads.
export const DuelsPendingPage = () => (
  <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
    <h1 className="text-lg font-bold">Duels</h1>
    <DuelHistorySkeleton />
  </section>
);

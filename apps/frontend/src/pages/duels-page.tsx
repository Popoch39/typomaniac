import { DuelHistory } from "@/components/duel-history/duel-history";

// The signed-in User's Duel history: every Duel they finished, the most recent first.
export const DuelsPage = () => (
  <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
    <h1 className="text-lg font-bold">Duels</h1>
    <DuelHistory />
  </section>
);

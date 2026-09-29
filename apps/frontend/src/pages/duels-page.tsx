import { DuelHistory } from "@/components/duel-history/duel-history";
import { DuelsHeader } from "@/components/duel-history/duels-header";

// The signed-in User's Duel history: every Duel they finished, the most recent first, and beside
// it the chosen one.
export const DuelsPage = () => (
  <section className="flex flex-col gap-6">
    <DuelsHeader />
    <DuelHistory />
  </section>
);

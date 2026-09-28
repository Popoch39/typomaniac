import { DuelHistory } from "@/components/duel-history/duel-history";
import { DuelsHeader } from "@/components/duel-history/duels-header";

// The signed-in User's Duel history: every Duel they finished, the most recent first.
export const DuelsPage = () => (
  <section className="flex flex-col gap-6">
    <DuelsHeader />
    <div className="w-full max-w-2xl">
      <DuelHistory />
    </div>
  </section>
);

import { EmptyState } from "@/components/ui/empty-state";

// The ranking of the season: its place is ready, its content comes with the ranked Duels.
export const LeaderboardPage = () => (
  <section className="flex flex-col gap-5">
    <h1 className="text-2xl font-extrabold">Classement</h1>
    <EmptyState
      title="Le classement arrive bientôt"
      reason="Les Duels classés et les paliers ne sont pas encore ouverts : il n'y a personne à classer pour l'instant."
    />
  </section>
);

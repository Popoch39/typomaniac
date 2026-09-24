import { getRouteApi, Link } from "@tanstack/react-router";

import { DuelReplay } from "@/components/replay/duel-replay";

const route = getRouteApi("/duels_/$duelId");

// The Replay of one of the User's Duels, from their Duel history. A new Duel starts a new Replay.
export const ReplayPage = () => {
  const { duelId } = route.useParams();

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-12">
      <Link to="/duels" className="text-sm text-muted-foreground hover:text-foreground">
        ← Duels
      </Link>
      <DuelReplay key={duelId} duelId={duelId} />
    </section>
  );
};

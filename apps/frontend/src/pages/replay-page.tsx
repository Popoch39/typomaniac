import { getRouteApi } from "@tanstack/react-router";

import { DuelReplay } from "@/components/replay/duel-replay";
import { ReplayBackLink } from "@/components/replay/replay-back-link";

const route = getRouteApi("/history_/$duelId");

// The Replay of one of the User's Duels, from their History, where « ← History » goes back to the
// week it was played in. A new Duel starts a new Replay.
export const ReplayPage = () => {
  const { duelId } = route.useParams();

  return (
    <section className="flex flex-col gap-5">
      <ReplayBackLink duelId={duelId} />
      <DuelReplay key={duelId} duelId={duelId} />
    </section>
  );
};

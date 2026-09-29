import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { DuelReplay } from "@/components/replay/duel-replay";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

const route = getRouteApi("/duels_/$duelId");

// The Replay of one of the User's Duels, from their Duel history, where « ← Duels » goes back with
// this Duel chosen. A new Duel starts a new Replay.
export const ReplayPage = () => {
  const { duelId } = route.useParams();
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-5">
      <Button
        variant="ghost"
        className="-ml-2.5 self-start rounded-[14px] pr-3.5 pl-2.5 text-muted-foreground"
        nativeButton={false}
        render={<Link to="/duels" search={{ duel: duelId }} />}
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4.5" />
        {m.replay_back({}, { locale })}
      </Button>
      <DuelReplay key={duelId} duelId={duelId} />
    </section>
  );
};

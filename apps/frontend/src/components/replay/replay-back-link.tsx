import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { replayedDuelQueryOptions } from "@/api/duel-history";
import { weekKeyOf } from "@/components/history/history-week";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// « ← History », back to the week the Duel was played in.
export const ReplayBackLink = ({ duelId }: { duelId: string }) => {
  const { data: duel } = useSuspenseQuery(replayedDuelQueryOptions(duelId));
  const locale = useLocale();

  return (
    <Button
      variant="ghost"
      className="-ml-2.5 self-start rounded-[14px] pr-3.5 pl-2.5 text-muted-foreground"
      nativeButton={false}
      render={<Link to="/history" search={{ week: weekKeyOf(duel.endedAt) }} />}
    >
      <ArrowLeftIcon aria-hidden="true" className="size-4.5" />
      {m.replay_back({}, { locale })}
    </Button>
  );
};

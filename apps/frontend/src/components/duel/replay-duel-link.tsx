import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Opens the Replay of the Duel just played.
export const ReplayDuelLink = ({ duelId }: { duelId: string }) => {
  const locale = useLocale();

  return (
    <Button
      variant="ghost"
      nativeButton={false}
      render={<Link to="/duels/$duelId" params={{ duelId }} />}
    >
      {m.duel_ended_replay({}, { locale })}
    </Button>
  );
};

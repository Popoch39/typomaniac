import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Opens the Replay of the Duel just played; dressed by its caller.
export const ReplayDuelLink = ({ duelId, className }: { duelId: string; className?: string }) => {
  const locale = useLocale();

  return (
    <Button
      variant="secondary"
      className={className}
      nativeButton={false}
      render={<Link to="/history/$duelId" params={{ duelId }} />}
    >
      <RotateCcw aria-hidden="true" strokeWidth={2.2} />
      {m.duel_ended_replay({}, { locale })}
    </Button>
  );
};

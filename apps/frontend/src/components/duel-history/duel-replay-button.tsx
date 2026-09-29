import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Opens the Replay of the chosen Duel, the main action of its details.
export const DuelReplayButton = ({ duelId }: { duelId: string }) => {
  const locale = useLocale();

  return (
    <Button
      size="lg"
      className="self-start rounded-[14px] text-[15px] font-bold"
      nativeButton={false}
      render={<Link to="/duels/$duelId" params={{ duelId }} />}
    >
      <Play aria-hidden="true" className="fill-current" />
      {m.duel_details_replay({}, { locale })}
    </Button>
  );
};

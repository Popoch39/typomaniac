import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type LeaveDuelProps = { connected: boolean; onLeave: () => void };

// Leaving the Duel on purpose: a Forfeit, the end screen follows. Only once connected: the server
// has to hear it. The only way out of the Duel's scene, drawn as its board draws it.
export const LeaveDuel = ({ connected, onLeave }: LeaveDuelProps) => {
  const locale = useLocale();

  return (
    <Button
      variant="ghost"
      disabled={!connected}
      onClick={onLeave}
      className="rounded-[14px] border-0 px-4.5 text-muted-foreground"
    >
      {m.hud_leave({}, { locale })}
    </Button>
  );
};

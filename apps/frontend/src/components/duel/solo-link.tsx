import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { usePlayStore } from "@/stores/play-store";

// Retour au Solo, from the end of a Duel: the play page, Solo chosen.
export const SoloLink = () => {
  const locale = useLocale();
  const setPlay = usePlayStore((state) => state.setPlay);

  return (
    <Button
      variant="ghost"
      nativeButton={false}
      render={<Link to="/" onClick={() => setPlay("solo")} />}
    >
      {m.queue_back_to_solo({}, { locale })}
    </Button>
  );
};

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useDuelStore } from "@/stores/duel-store";

// Jouer ici: takes the place back from the tab that plays it, the Duel resumed or the Queue joined.
export const PlayHereButton = () => {
  const locale = useLocale();
  const claim = useDuelStore((store) => store.claim);

  return (
    <Button variant="outline" onClick={claim}>
      {m.duel_play_here({}, { locale })}
    </Button>
  );
};

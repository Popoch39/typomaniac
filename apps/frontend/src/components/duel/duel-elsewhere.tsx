import { DuelInterrupted } from "@/components/duel/duel-interrupted";
import { PlayHereButton } from "@/components/duel/play-here-button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Another tab plays the User's place, the Queue or the Duel: said, with the way to play here.
export const DuelElsewhere = () => {
  const locale = useLocale();

  return (
    <DuelInterrupted message={m.duel_elsewhere({}, { locale })}>
      <PlayHereButton />
    </DuelInterrupted>
  );
};

import { DuelArea } from "@/components/duel/duel-area";
import { useInDuel } from "@/components/duel/use-in-duel";
import { PlayCards } from "@/components/play/play-cards";
import { PlayFadePage } from "@/components/play/play-fade-page";
import { RUN_PATH } from "@/components/play/play-paths";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Jouer: the three cards of what can be played, or the search launched from the Ranked one in their
// place (the Queue: DuelArea). A Duel found is played on its own URL (DuelPage). Fades in from the
// Run.
export const HomePage = () => {
  const locale = useLocale();
  const inDuel = useInDuel();

  return (
    <PlayFadePage from={RUN_PATH} className="gap-6">
      {inDuel ? (
        <>
          <h1 className="sr-only">{m.play_title({}, { locale })}</h1>
          <DuelArea />
        </>
      ) : (
        <PlayCards />
      )}
    </PlayFadePage>
  );
};

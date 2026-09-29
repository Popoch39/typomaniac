import { DuelArea } from "@/components/duel/duel-area";
import { useInDuel } from "@/components/duel/use-in-duel";
import { RunSettings } from "@/components/run/run-settings";
import { SoloArea } from "@/components/run/solo-area";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The play page, as tall as the window: the settings at the top, then the Solo Run or the Queue in
// the room left. A Duel found is played on its own URL (DuelPage).
export const HomePage = () => {
  const locale = useLocale();
  const inDuel = useInDuel();

  return (
    <section className="flex flex-1 flex-col gap-4">
      <h1 className="sr-only">{m.play_title({}, { locale })}</h1>
      <RunSettings />
      {inDuel ? <DuelArea /> : <SoloArea />}
    </section>
  );
};

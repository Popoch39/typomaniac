import { DuelArea } from "@/components/duel/duel-area";
import { useInDuel } from "@/components/duel/use-in-duel";
import { useInDuelScene } from "@/components/duel-scene/use-in-duel-scene";
import { RunSettings } from "@/components/run/run-settings";
import { SoloArea } from "@/components/run/solo-area";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The play page, as tall as the window: the settings at the top, then the Solo Run or the Duel in
// the room left. In the Duel's scene, the Duel alone, filling it.
export const HomePage = () => {
  const locale = useLocale();
  const inDuel = useInDuel();
  const inDuelScene = useInDuelScene();

  return (
    <section className="flex flex-1 flex-col gap-4 duel-scene:gap-0">
      <h1 className="sr-only">{m.play_title({}, { locale })}</h1>
      {inDuelScene ? null : <RunSettings />}
      {inDuel ? <DuelArea /> : <SoloArea />}
    </section>
  );
};

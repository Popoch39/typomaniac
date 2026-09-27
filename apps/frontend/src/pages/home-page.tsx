import { DuelArea } from "@/components/duel/duel-area";
import { useInDuel } from "@/components/duel/use-in-duel";
import { useInDuelScene } from "@/components/duel-scene/use-in-duel-scene";
import { RunSettings } from "@/components/run/run-settings";
import { SoloArea } from "@/components/run/solo-area";

// The play page: the settings, then the Solo Run or the Duel. In the Duel's scene, the Duel alone,
// filling it.
export const HomePage = () => {
  const inDuel = useInDuel();
  const inDuelScene = useInDuelScene();

  return (
    <section className="flex flex-col gap-4 py-12 duel-scene:flex-1 duel-scene:gap-0 duel-scene:py-0">
      <h1 className="sr-only">typomaniac</h1>
      {inDuelScene ? null : <RunSettings />}
      {inDuel ? <DuelArea /> : <SoloArea />}
    </section>
  );
};

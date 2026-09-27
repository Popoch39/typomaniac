import { cn } from "cn";

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
    <section className={cn("flex flex-col", inDuelScene ? "flex-1" : "gap-4 py-12")}>
      <h1 className="sr-only">typomaniac</h1>
      {inDuelScene ? null : <RunSettings />}
      {inDuel ? <DuelArea /> : <SoloArea />}
    </section>
  );
};

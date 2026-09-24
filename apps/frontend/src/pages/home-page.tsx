import { DuelArea } from "@/components/duel/duel-area";
import { useInDuel } from "@/components/duel/use-in-duel";
import { RunSettings } from "@/components/run/run-settings";
import { SoloArea } from "@/components/run/solo-area";

// The play page: the settings, then the Solo Run or the Duel.
export const HomePage = () => {
  const inDuel = useInDuel();

  return (
    <section className="flex flex-col gap-4 py-12">
      <h1 className="sr-only">typomaniac</h1>
      <RunSettings />
      {inDuel ? <DuelArea /> : <SoloArea />}
    </section>
  );
};

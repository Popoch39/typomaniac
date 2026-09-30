import { sceneHeldOf, useDuelBridgeStore } from "@/stores/duel-bridge-store";
import { duelOf, useDuelStore } from "@/stores/duel-store";

// A Duel is played in this tab, from its Countdown until the server ends it: the app is drawn as
// the Duel's scene, once the Face-off's panels cover the screen when it comes from its pairing
// (the Duel's bridge). The Queue, the Match proposal and the end screen keep the app's layout.
export const useInDuelScene = () => {
  const inDuel = useDuelStore((store) => duelOf(store.state) !== null);
  const held = useDuelBridgeStore(sceneHeldOf);

  return inDuel && !held;
};

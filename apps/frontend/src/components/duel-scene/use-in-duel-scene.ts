import { duelOf, useDuelStore } from "@/stores/duel-store";

// A Duel is played in this tab, from its Countdown until the server ends it: the app is drawn as
// the Duel's scene. The Queue, the Match proposal and the end screen keep the app's layout.
export const useInDuelScene = () => useDuelStore((store) => duelOf(store.state) !== null);

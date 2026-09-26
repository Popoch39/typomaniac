import { useDuelSearchGesture } from "@/components/duel/use-duel-search-gesture";
import { useDuelStore } from "@/stores/duel-store";

// Joins the Queue from a click, which lets the Face-off of the Duel found sound and its Match
// proposal notify.
export const useSearchDuel = () => {
  const joinQueue = useDuelStore((store) => store.joinQueue);
  const searchGesture = useDuelSearchGesture();

  return () => {
    searchGesture();
    joinQueue();
  };
};

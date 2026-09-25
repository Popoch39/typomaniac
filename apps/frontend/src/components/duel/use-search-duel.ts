import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { useDuelStore } from "@/stores/duel-store";

// Joins the Queue from a click, which lets the Face-off of the Duel found sound.
export const useSearchDuel = () => {
  const joinQueue = useDuelStore((store) => store.joinQueue);
  const { unlock } = useFaceOffSounds();

  return () => {
    unlock();
    joinQueue();
  };
};

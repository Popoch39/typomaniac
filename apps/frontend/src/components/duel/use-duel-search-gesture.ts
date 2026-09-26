import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { useTabAttention } from "@/components/match-proposal/tab-attention-context";

// What the click that searches for a Duel lets happen later, as browsers only allow it from a
// click: the Face-off's sound, and the notification of a Match proposal. The permission is asked
// once: after a refusal, the sound and the tab's title are enough.
export const useDuelSearchGesture = () => {
  const { unlock } = useFaceOffSounds();
  const attention = useTabAttention();

  return () => {
    unlock();

    if (attention.permission() === "default") {
      attention.requestPermission();
    }
  };
};

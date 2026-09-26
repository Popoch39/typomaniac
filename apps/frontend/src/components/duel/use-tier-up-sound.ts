import { useEffect, useRef } from "react";

import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

// Once, when the celebration of a move up into a new Tier appears: its sound, on the Face-off's
// engine, unless the Face-off is muted.
export const useTierUpSound = () => {
  const sounds = useFaceOffSounds();
  // Kept across the effect's reruns (Strict Mode): the sound plays once.
  const played = useRef(false);

  useEffect(() => {
    if (played.current) {
      return;
    }

    played.current = true;

    if (!useFaceOffSoundStore.getState().muted) {
      sounds.play("rank-up");
    }
  }, [sounds]);
};

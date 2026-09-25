import { Volume2Icon, VolumeXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

// Mutes the Face-off's sounds, or brings them back: kept for the next Duels. In ink, top right,
// over the opponent's colour; it fades with the overlay's exit.
export const FaceOffMute = () => {
  const muted = useFaceOffSoundStore((store) => store.muted);
  const toggleMuted = useFaceOffSoundStore((store) => store.toggleMuted);

  return (
    <Button
      data-face-off="mute"
      variant="ghost"
      size="icon"
      aria-label="Couper le son"
      aria-pressed={muted}
      className="absolute top-6 right-6 text-background hover:bg-background/15 hover:text-background"
      onClick={toggleMuted}
    >
      {muted ? <VolumeXIcon aria-hidden /> : <Volume2Icon aria-hidden />}
    </Button>
  );
};

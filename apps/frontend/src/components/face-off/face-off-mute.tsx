import { Volume2Icon, VolumeXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

// Mutes the Face-off's sounds, or brings them back: kept for the next Duels. Top right, in the ink
// the Theme lays on the opponent's colour, over it; it fades with the overlay's exit.
export const FaceOffMute = () => {
  const muted = useFaceOffSoundStore((store) => store.muted);
  const toggleMuted = useFaceOffSoundStore((store) => store.toggleMuted);
  const locale = useLocale();

  return (
    <Button
      data-face-off="mute"
      variant="ghost"
      size="icon"
      aria-label={m.face_off_mute({}, { locale })}
      aria-pressed={muted}
      className="absolute top-6 right-6 text-on-opponent hover:bg-on-opponent/15 hover:text-on-opponent"
      onClick={toggleMuted}
    >
      {muted ? <VolumeXIcon aria-hidden /> : <Volume2Icon aria-hidden />}
    </Button>
  );
};

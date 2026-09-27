import { RotateCcwIcon, Volume2Icon, VolumeXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

type TierUpDevControlsProps = {
  // Replays the last Tier-up, once one was played.
  onReplay: (() => void) | null;
  forcedReducedMotion: boolean;
  onForcedReducedMotion: (forced: boolean) => void;
};

// What the dev page sets before a Tier-up plays: replaying the last one, reduced motion forced on
// whatever the system says, and the Face-off's mute, which the Tier-up follows.
export const TierUpDevControls = ({
  onReplay,
  forcedReducedMotion,
  onForcedReducedMotion,
}: TierUpDevControlsProps) => {
  const muted = useFaceOffSoundStore((store) => store.muted);
  const toggleMuted = useFaceOffSoundStore((store) => store.toggleMuted);

  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" disabled={onReplay === null} onClick={() => onReplay?.()}>
        <RotateCcwIcon aria-hidden />
        Rejouer
      </Button>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={forcedReducedMotion}
          className="size-4 accent-primary"
          onChange={(event) => onForcedReducedMotion(event.target.checked)}
        />
        Animations réduites
      </label>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Couper le son"
        aria-pressed={muted}
        onClick={toggleMuted}
      >
        {muted ? <VolumeXIcon aria-hidden /> : <Volume2Icon aria-hidden />}
      </Button>
    </div>
  );
};

import { useId } from "react";

import { Slider } from "@/components/ui/slider";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useSoundStore } from "@/stores/sound-store";

// The volume of every sound, from 0 to 1, by mouse or arrow keys.
export const VolumeSlider = () => {
  const locale = useLocale();
  const labelId = useId();
  const volume = useSoundStore((state) => state.volume);
  const setVolume = useSoundStore((state) => state.setVolume);

  return (
    <div className="flex flex-col gap-2 px-1 pt-1">
      <span id={labelId} className="text-muted-foreground">
        {m.sound_volume({}, { locale })}
      </span>
      <Slider
        aria-labelledby={labelId}
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onValueChange={setVolume}
      />
    </div>
  );
};

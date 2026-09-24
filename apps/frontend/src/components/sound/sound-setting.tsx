import { SoundIcon } from "@/components/sound/sound-icon";
import { SoundPackPicker } from "@/components/sound/sound-pack-picker";
import { VolumeSlider } from "@/components/sound/volume-slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// The speaker of the settings bar, in solo and in Duel: it opens the Sound pack and the volume.
export const SoundSetting = () => (
  <Popover>
    <PopoverTrigger
      render={<Button variant="ghost" size="icon-sm" className="text-muted-foreground" />}
    >
      <SoundIcon />
    </PopoverTrigger>
    <PopoverContent className="w-48 gap-3">
      <SoundPackPicker />
      <VolumeSlider />
    </PopoverContent>
  </Popover>
);

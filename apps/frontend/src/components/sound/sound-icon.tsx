import { Volume2Icon, VolumeXIcon } from "lucide-react";

import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useSoundStore } from "@/stores/sound-store";

// The speaker of the sound button: crossed out when the sound is off, so the silence is explained.
export const SoundIcon = () => {
  const locale = useLocale();
  const off = useSoundStore((state) => state.pack === "off");

  return off ? (
    <>
      <VolumeXIcon aria-hidden />
      <span className="sr-only">{m.sound_off_label({}, { locale })}</span>
    </>
  ) : (
    <>
      <Volume2Icon aria-hidden />
      <span className="sr-only">{m.sound_label({}, { locale })}</span>
    </>
  );
};

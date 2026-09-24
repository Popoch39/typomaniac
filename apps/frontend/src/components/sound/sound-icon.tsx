import { Volume2Icon, VolumeXIcon } from "lucide-react";

import { useSoundStore } from "@/stores/sound-store";

// The speaker of the sound button: crossed out when the sound is off, so the silence is explained.
export const SoundIcon = () => {
  const off = useSoundStore((state) => state.pack === "off");

  return off ? (
    <>
      <VolumeXIcon aria-hidden />
      <span className="sr-only">Son coupé</span>
    </>
  ) : (
    <>
      <Volume2Icon aria-hidden />
      <span className="sr-only">Son</span>
    </>
  );
};

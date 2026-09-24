import { useInDuel } from "@/components/duel/use-in-duel";
import { DuelFormat } from "@/components/settings/duel-format";
import { PlaySetting } from "@/components/settings/play-setting";
import { SoloSettings } from "@/components/settings/solo-settings";

import { SoundSetting } from "@/components/sound/sound-setting";

// Solo or Duel first, then the Solo settings, or the Duel's fixed format, and the sound last.
export const SettingsBar = () => {
  const inDuel = useInDuel();

  return (
    <fieldset className="flex min-w-0 flex-wrap items-center justify-center gap-x-6 gap-y-2">
      <legend className="sr-only">Réglages</legend>
      <PlaySetting />
      {inDuel ? <DuelFormat /> : <SoloSettings />}
      <SoundSetting />
    </fieldset>
  );
};

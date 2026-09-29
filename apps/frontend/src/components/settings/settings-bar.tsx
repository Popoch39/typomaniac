import { useInDuel } from "@/components/duel/use-in-duel";
import { DuelFormat } from "@/components/settings/duel-format";
import { PlaySetting } from "@/components/settings/play-setting";
import { SoloSettings } from "@/components/settings/solo-settings";
import { SoundSetting } from "@/components/sound/sound-setting";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Solo or Duel first, then the Solo settings, or the Duel's fixed format, and the sound last.
export const SettingsBar = () => {
  const locale = useLocale();
  const inDuel = useInDuel();

  return (
    <fieldset className="flex min-w-0 flex-wrap items-center justify-center gap-3">
      <legend className="sr-only">{m.settings_label({}, { locale })}</legend>
      <PlaySetting />
      {inDuel ? <DuelFormat /> : <SoloSettings />}
      <SoundSetting />
    </fieldset>
  );
};

import { DurationSetting } from "@/components/settings/duration-setting";
import { LanguageSetting } from "@/components/settings/language-setting";
import { ModeSetting } from "@/components/settings/mode-setting";
import { WordCountSetting } from "@/components/settings/word-count-setting";
import { SoundSetting } from "@/components/sound/sound-setting";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useSettingsStore } from "@/stores/settings-store";

// The Run's settings: the Mode, then its duration or word count, the Language, and the sound last.
// A Duel is launched from Jouer, never from here.
export const SettingsBar = () => {
  const locale = useLocale();
  const mode = useSettingsStore((state) => state.mode);

  return (
    <fieldset className="flex min-w-0 flex-wrap items-center justify-center gap-3">
      <legend className="sr-only">{m.settings_label({}, { locale })}</legend>
      <ModeSetting />
      {mode === "time" ? <DurationSetting /> : <WordCountSetting />}
      <LanguageSetting />
      <SoundSetting />
    </fieldset>
  );
};

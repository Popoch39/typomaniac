import { DurationSetting } from "@/components/settings/duration-setting";
import { LanguageSetting } from "@/components/settings/language-setting";
import { ModeSetting } from "@/components/settings/mode-setting";
import { WordCountSetting } from "@/components/settings/word-count-setting";
import { useSettingsStore } from "@/stores/settings-store";

// The Run settings: the Mode, then its duration or word count, and the Language.
export const SettingsBar = () => {
  const mode = useSettingsStore((state) => state.mode);

  return (
    <fieldset className="flex min-w-0 flex-wrap items-center justify-center gap-x-6 gap-y-2">
      <legend className="sr-only">Réglages</legend>
      <ModeSetting />
      {mode === "time" ? <DurationSetting /> : <WordCountSetting />}
      <LanguageSetting />
    </fieldset>
  );
};

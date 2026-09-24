import { DurationSetting } from "@/components/settings/duration-setting";
import { LanguageSetting } from "@/components/settings/language-setting";
import { ModeSetting } from "@/components/settings/mode-setting";
import { WordCountSetting } from "@/components/settings/word-count-setting";
import { useSettingsStore } from "@/stores/settings-store";

// The Solo settings: the Mode, then its duration or word count, and the Language.
export const SoloSettings = () => {
  const mode = useSettingsStore((state) => state.mode);

  return (
    <>
      <ModeSetting />
      {mode === "time" ? <DurationSetting /> : <WordCountSetting />}
      <LanguageSetting />
    </>
  );
};

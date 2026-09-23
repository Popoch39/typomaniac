import { type SettingOption, SettingGroup } from "@/components/settings/setting-group";
import { type Settings, useSettingsStore } from "@/stores/settings-store";

const languages: readonly SettingOption<Settings["language"]>[] = [
  { value: "fr", label: "français" },
  { value: "en", label: "anglais" },
];

export const LanguageSetting = () => {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  return (
    <SettingGroup label="Langue" options={languages} value={language} onChange={setLanguage} />
  );
};

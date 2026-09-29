import { type SettingOption, SettingGroup } from "@/components/settings/setting-group";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { type Settings, useSettingsStore } from "@/stores/settings-store";

export const ModeSetting = () => {
  const locale = useLocale();
  const mode = useSettingsStore((state) => state.mode);
  const setMode = useSettingsStore((state) => state.setMode);

  const modes: readonly SettingOption<Settings["mode"]>[] = [
    { value: "time", label: m.settings_mode_time({}, { locale }) },
    { value: "words", label: m.settings_mode_words({}, { locale }) },
  ];

  return (
    <SettingGroup
      label={m.settings_mode({}, { locale })}
      options={modes}
      value={mode}
      onChange={setMode}
    />
  );
};

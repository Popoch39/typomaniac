import { type SettingOption, SettingGroup } from "@/components/settings/setting-group";
import { type Settings, useSettingsStore } from "@/stores/settings-store";

const modes: readonly SettingOption<Settings["mode"]>[] = [
  { value: "time", label: "time" },
  { value: "words", label: "words" },
];

export const ModeSetting = () => {
  const mode = useSettingsStore((state) => state.mode);
  const setMode = useSettingsStore((state) => state.setMode);

  return <SettingGroup label="Mode" options={modes} value={mode} onChange={setMode} />;
};

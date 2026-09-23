import { SettingGroup } from "@/components/settings/setting-group";
import { durations, useSettingsStore } from "@/stores/settings-store";

const options = durations.map((seconds) => ({ value: seconds, label: `${seconds}` }));

// How long a `time` Run lasts, in seconds.
export const DurationSetting = () => {
  const seconds = useSettingsStore((state) => state.seconds);
  const setSeconds = useSettingsStore((state) => state.setSeconds);

  return <SettingGroup label="Durée" options={options} value={seconds} onChange={setSeconds} />;
};

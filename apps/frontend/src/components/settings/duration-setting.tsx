import { SettingGroup } from "@/components/settings/setting-group";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { durations, useSettingsStore } from "@/stores/settings-store";

// How long a `time` Run lasts, in seconds.
export const DurationSetting = () => {
  const locale = useLocale();
  const seconds = useSettingsStore((state) => state.seconds);
  const setSeconds = useSettingsStore((state) => state.setSeconds);

  const options = durations.map((value) => ({
    value,
    label: numberFormat(locale).format(value),
  }));

  return (
    <SettingGroup
      label={m.settings_duration({}, { locale })}
      options={options}
      value={seconds}
      onChange={setSeconds}
    />
  );
};

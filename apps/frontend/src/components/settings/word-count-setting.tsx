import { SettingGroup } from "@/components/settings/setting-group";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useSettingsStore, wordCounts } from "@/stores/settings-store";

// How many words a `words` Run has.
export const WordCountSetting = () => {
  const locale = useLocale();
  const words = useSettingsStore((state) => state.words);
  const setWords = useSettingsStore((state) => state.setWords);

  const options = wordCounts.map((value) => ({
    value,
    label: numberFormat(locale).format(value),
  }));

  return (
    <SettingGroup
      label={m.settings_word_count({}, { locale })}
      options={options}
      value={words}
      onChange={setWords}
    />
  );
};

import { SettingGroup } from "@/components/settings/setting-group";
import { useSettingsStore, wordCounts } from "@/stores/settings-store";

const options = wordCounts.map((words) => ({ value: words, label: `${words}` }));

// How many words a `words` Run has.
export const WordCountSetting = () => {
  const words = useSettingsStore((state) => state.words);
  const setWords = useSettingsStore((state) => state.setWords);

  return (
    <SettingGroup label="Nombre de mots" options={options} value={words} onChange={setWords} />
  );
};

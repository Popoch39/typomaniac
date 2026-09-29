import type { Language } from "typing-engine";

import { type SettingOption, SettingGroup } from "@/components/settings/setting-group";
import { languageName } from "@/lib/language-names";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { runLanguage, useSettingsStore } from "@/stores/settings-store";

const LANGUAGES: readonly Language[] = ["fr", "en"];

// The Language of the Runs: the Locale's until one is chosen, which then stays whatever the Locale.
export const LanguageSetting = () => {
  const locale = useLocale();
  const chosen = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const options: readonly SettingOption<Language>[] = LANGUAGES.map((language) => ({
    value: language,
    label: languageName(language, locale),
  }));

  return (
    <SettingGroup
      label={m.settings_language({}, { locale })}
      options={options}
      value={runLanguage(chosen, locale)}
      onChange={setLanguage}
    />
  );
};

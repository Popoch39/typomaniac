import { PROGRESSION_WINDOWS, type ProgressionWindow } from "@/api/profile";
import { SettingGroup } from "@/components/settings/setting-group";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A window's name in the Locale: « 50 derniers », "last 50", « tous ».
const windowLabel = (span: ProgressionWindow, locale: Locale) =>
  span === "all"
    ? m.profile_progression_window_all({}, { locale })
    : m.profile_progression_window_last(
        { count: numberFormat(locale).format(Number(span)) },
        { locale },
      );

// Which of their last Duels the Progression shows, as segmented pills sunk into the card: the
// chosen one raised on the card's raised surface, never filled with the accent, which the average
// wpm beside it holds.
export const ProgressionWindowPicker = ({
  span,
  onChange,
}: {
  span: ProgressionWindow;
  onChange: (span: ProgressionWindow) => void;
}) => {
  const locale = useLocale();

  const options = PROGRESSION_WINDOWS.map((value) => ({
    value,
    label: windowLabel(value, locale),
  }));

  return (
    <SettingGroup
      label={m.profile_progression_window({}, { locale })}
      options={options}
      value={span}
      onChange={onChange}
      className="shrink-0 bg-background"
      optionClassName="px-4 aria-pressed:bg-surface-2 aria-pressed:text-foreground aria-pressed:hover:bg-surface-2"
    />
  );
};

import { DUEL_LANGUAGE, DUEL_SECONDS } from "@/components/duel/duel-format-line";
import { languageName } from "@/lib/language-names";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Duel's format, shown, not chosen: « time 30 · English ».
export const DuelFormat = () => {
  const locale = useLocale();

  return (
    <p className="flex h-13 items-center rounded-full bg-card px-5 text-xs text-muted-foreground">
      <span className="sr-only">{m.settings_duel_format_label({}, { locale })}</span>
      {m.settings_duel_format(
        {
          seconds: numberFormat(locale).format(DUEL_SECONDS),
          language: languageName(DUEL_LANGUAGE, locale),
        },
        { locale },
      )}
    </p>
  );
};

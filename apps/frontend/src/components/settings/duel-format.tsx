import type { Language } from "typing-engine";

import { languageName } from "@/lib/language-names";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Every Duel has the same format, set by the server.
const DUEL_SECONDS = 30;

const DUEL_LANGUAGE: Language = "en";

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

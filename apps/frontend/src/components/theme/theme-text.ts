import type { ThemeId } from "@/components/theme/themes";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

type ThemeText = { name: (locale: Locale) => string; description: (locale: Locale) => string };

// The words of the "Thèmes" board, for each Theme: its name, then what it is.
const THEME_TEXTS: Record<ThemeId, ThemeText> = {
  coral: {
    name: (locale) => m.theme_name_coral({}, { locale }),
    description: (locale) => m.theme_description_coral({}, { locale }),
  },
  lagoon: {
    name: (locale) => m.theme_name_lagoon({}, { locale }),
    description: (locale) => m.theme_description_lagoon({}, { locale }),
  },
  matcha: {
    name: (locale) => m.theme_name_matcha({}, { locale }),
    description: (locale) => m.theme_description_matcha({}, { locale }),
  },
  lilac: {
    name: (locale) => m.theme_name_lilac({}, { locale }),
    description: (locale) => m.theme_description_lilac({}, { locale }),
  },
  sakura: {
    name: (locale) => m.theme_name_sakura({}, { locale }),
    description: (locale) => m.theme_description_sakura({}, { locale }),
  },
  arcade: {
    name: (locale) => m.theme_name_arcade({}, { locale }),
    description: (locale) => m.theme_description_arcade({}, { locale }),
  },
  chalk: {
    name: (locale) => m.theme_name_chalk({}, { locale }),
    description: (locale) => m.theme_description_chalk({}, { locale }),
  },
  paper: {
    name: (locale) => m.theme_name_paper({}, { locale }),
    description: (locale) => m.theme_description_paper({}, { locale }),
  },
};

// A Theme's name in the Locale: « Corail », "Coral".
export const themeName = (id: ThemeId, locale: Locale) => THEME_TEXTS[id].name(locale);

// What a Theme is, in the Locale, under its name on its card.
export const themeDescription = (id: ThemeId, locale: Locale) =>
  THEME_TEXTS[id].description(locale);

import type { Locale } from "@/locale/locales";

// The delivery switch (spec #138): English opens once every zone is translated. Until then a
// production build resolves every URL to French, keeps no Locale and hides the switch; a dev build
// opens both, to check each zone under /en. The last ticket of the Locale removes it.
export const englishOpen = () => import.meta.env.DEV;

// The Locale shown for `locale`: itself, or French until English opens.
export const deliveredLocale = (locale: Locale): Locale => (englishOpen() ? locale : "fr");

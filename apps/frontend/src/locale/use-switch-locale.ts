import { useRouter } from "@tanstack/react-router";

import { replaceLocale } from "@/locale/locale-history";
import type { Locale } from "@/locale/locales";
import { useLocaleStore } from "@/stores/locale-store";

// Switches to `locale` without ever reloading the page: kept as this browser's choice, then the
// same page under the other prefix, in place of the current entry. The router reads the new URL,
// shows its Locale, and renders the same page again: nothing is mounted anew, the WebSocket and a
// Queue or Match proposal under way live on. Navigating would not do: to the router, a URL that
// differs only by its Locale is the page already shown.
export const useSwitchLocale = () => {
  const { history } = useRouter();
  const choose = useLocaleStore((store) => store.choose);

  return (locale: Locale) => {
    choose(locale);
    replaceLocale(history, locale);
  };
};

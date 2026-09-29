import type { RouterHistory } from "@tanstack/react-router";

import type { Locale } from "@/locale/locales";
import { withLocale } from "@/locale/locale-url";

// The current entry of `history` replaced by the same URL in `locale`, its state kept: no new
// entry, and no navigation for the router, which reads the new URL as the page already shown.
export const replaceLocale = (history: RouterHistory, locale: Locale) =>
  history.replace(withLocale(history.location.href, locale), history.location.state);

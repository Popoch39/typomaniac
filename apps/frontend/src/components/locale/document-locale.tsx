import { useEffect } from "react";

import { useLocale } from "@/locale/use-locale";

// Mounted once at the root: the Locale shown, on <html lang>, for screen readers to speak it right.
// The inline script of index.html set it first, before React mounts.
export const DocumentLocale = () => {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
};

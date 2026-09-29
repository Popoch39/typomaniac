import { useEffect } from "react";

import { themeOf } from "@/components/theme/themes";
import { useThemeStore } from "@/stores/theme-store";

// Mounted once at the root: the Theme in use, on <html>, where the stylesheet reads it. Everything
// below, portals included, takes its colours from there. The color-scheme meta of index.html
// follows it too, dark or light, as its inline script first set it.
export const DocumentTheme = () => {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute("content", themeOf(theme).scheme);
  }, [theme]);

  return null;
};

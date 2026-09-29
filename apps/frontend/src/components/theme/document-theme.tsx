import { useEffect } from "react";

import { themeFavicon } from "@/components/theme/theme-favicon";
import { themeOf } from "@/components/theme/themes";
import { useThemeStore } from "@/stores/theme-store";

// Mounted once at the root: the Theme in use, on <html>, where the stylesheet reads it. Everything
// below, portals included, takes its colours from there. The color-scheme meta of index.html
// follows it too, dark or light, and so does the tab's icon, as its inline script first set them.
export const DocumentTheme = () => {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute("content", themeOf(theme).scheme);
    document.querySelector('link[rel="icon"]')?.setAttribute("href", themeFavicon(theme));
  }, [theme]);

  return null;
};

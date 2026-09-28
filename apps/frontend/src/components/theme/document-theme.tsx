import { useEffect } from "react";

import { useThemeStore } from "@/stores/theme-store";

// Mounted once at the root: the Theme in use, on <html>, where the stylesheet reads it. Everything
// below, portals included, takes its colours from there.
export const DocumentTheme = () => {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
};

import { type ReactNode, useEffect, useState } from "react";

import { type Theme, ThemeProviderContext } from "@/components/theme-context";

// Adapted from https://ui.shadcn.com/docs/dark-mode/vite

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

const isTheme = (value: string | null): value is Theme =>
  value === "dark" || value === "light" || value === "system";

export const ThemeProvider = ({
  children,
  defaultTheme = "system",
  // Keep in sync with the anti-flash script in index.html, which reads this key before first paint.
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey);

    return isTheme(stored) ? stored : defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);

      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (nextTheme: Theme) => {
      localStorage.setItem(storageKey, nextTheme);
      setTheme(nextTheme);
    },
  };

  return <ThemeProviderContext value={value}>{children}</ThemeProviderContext>;
};

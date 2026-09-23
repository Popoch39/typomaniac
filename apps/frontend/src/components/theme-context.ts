import { createContext, use } from "react";

// Split out of theme-provider.tsx so that file only exports components (react/only-export-components).

export type Theme = "dark" | "light" | "system";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export const useTheme = () => {
  const context = use(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

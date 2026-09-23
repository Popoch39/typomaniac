import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  toggle: () => void;
};

// Keep in sync with the anti-flash script in index.html, which reads this key before first paint.
const THEME_STORAGE_KEY = "typomaniac-theme";

const systemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: systemTheme(),
      toggle: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    { name: THEME_STORAGE_KEY, partialize: (state) => ({ theme: state.theme }) },
  ),
);

// The initial class is set by index.html; this keeps <html> in sync with later changes.
useThemeStore.subscribe((state) => {
  document.documentElement.classList.toggle("dark", state.theme === "dark");
});

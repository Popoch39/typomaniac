import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_THEME, THEMES, type ThemeId } from "@/components/theme/themes";
import { safeStorage } from "@/lib/safe-storage";

// What is stored, checked on load: an unknown Theme, or a value edited by hand, is ignored (Corail),
// and left stored until another Theme is chosen.
const ThemeSettingSchema = Type.Object({
  theme: Type.Union(THEMES.map((theme) => Type.Literal(theme.id))),
});

type ThemeStore = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

// The Theme, a preference of this browser, for a User as for a Visitor: kept in localStorage, never
// sent to the server, kept through signing in and out. The inline script of index.html reads the
// same entry (its key, its JSON with `state.theme` and `version`) to set it before the first paint:
// change both together.
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME.id,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "typomaniac-theme",
      version: 1,
      storage: createJSONStorage(() => safeStorage(() => window.localStorage)),
      partialize: ({ theme }) => ({ theme }),
      merge: (stored, current) =>
        Value.Check(ThemeSettingSchema, stored) ? { ...current, theme: stored.theme } : current,
    },
  ),
);

import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_THEME, THEMES, type ThemeId } from "@/components/theme/themes";
import { safeStorage } from "@/lib/safe-storage";

// What is stored, checked on load: an unknown Theme, or a value edited by hand, is ignored (Coral),
// and left stored until another Theme is chosen.
const ThemeSettingSchema = Type.Object({
  theme: Type.Union(THEMES.map((theme) => Type.Literal(theme.id))),
});

// The ids version 1 kept, before the Themes had English ones, and the Theme each one is now. The
// inline script of index.html knows them too, for the first load after they changed
// (theme-boot.test.ts keeps the two in step).
export const FORMER_THEME_IDS: ReadonlyMap<string, ThemeId> = new Map([
  ["corail", "coral"],
  ["lagon", "lagoon"],
  ["matcha", "matcha"],
  ["lilas", "lilac"],
  ["sakura", "sakura"],
  ["arcade", "arcade"],
  ["craie", "chalk"],
  ["papier", "paper"],
]);

const FormerThemeSettingSchema = Type.Object({ theme: Type.String() });

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
      version: 2,
      storage: createJSONStorage(() => safeStorage(() => window.localStorage)),
      partialize: ({ theme }) => ({ theme }),
      // An entry of another version (only version 1 exists): a former id is kept under the Theme
      // it is now, anything else gives Coral back; the entry is then stored again, in version 2.
      migrate: (stored) => {
        const now = Value.Check(FormerThemeSettingSchema, stored)
          ? FORMER_THEME_IDS.get(stored.theme)
          : undefined;

        return { theme: now ?? DEFAULT_THEME.id };
      },
      merge: (stored, current) =>
        Value.Check(ThemeSettingSchema, stored) ? { ...current, theme: stored.theme } : current,
    },
  ),
);

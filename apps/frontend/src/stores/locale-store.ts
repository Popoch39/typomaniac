import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { safeStorage } from "@/lib/safe-storage";
import { baseLocale, type Locale, locales } from "@/locale/locales";
import { overwriteGetLocale } from "@/paraglide/runtime";

// What is stored, checked on load: an unknown Locale, or a value edited by hand, is ignored (none
// chosen), and left stored until another Locale is chosen.
const LocaleSettingSchema = Type.Object({
  chosen: Type.Union(locales.map((locale) => Type.Literal(locale))),
});

type LocaleStore = {
  // The Locale shown, the URL's: the app's router sets it from each URL's prefix.
  locale: Locale;
  // The Locale kept by this browser, which a URL without a prefix leads to: set by the switch, or
  // at the first visit when none is kept yet.
  chosen: Locale | null;
  show: (locale: Locale) => void;
  choose: (locale: Locale) => void;
};

const localStorageOf = () => window.localStorage;

// The Locale (ADR 0011), a preference of this browser like the Theme, for a User as for a Visitor:
// kept in localStorage, never sent to the server. The inline script of index.html reads the same
// entry (its key, its JSON with `state.chosen` and `version`) to set `<html lang>` before the first
// paint: change both together.
export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: baseLocale,
      chosen: null,
      show: (locale) => set({ locale }),
      choose: (chosen) => set({ chosen }),
    }),
    {
      name: "typomaniac-locale",
      version: 1,
      storage: createJSONStorage(() => safeStorage(localStorageOf)),
      partialize: ({ chosen }) => ({ chosen }),
      merge: (stored, current) =>
        Value.Check(LocaleSettingSchema, stored) ? { ...current, chosen: stored.chosen } : current,
    },
  ),
);

// Keeps the Locale in `getStorage()` (the browser's localStorage, a test's own), and reads the one
// kept there. The storage being synchronous, it is read by the time this returns.
export const readLocaleFrom = (getStorage: () => Storage) => {
  useLocaleStore.persist.setOptions({ storage: createJSONStorage(() => safeStorage(getStorage)) });
  void useLocaleStore.persist.rehydrate();
};

// Every message is said in the Locale shown, the store's: Paraglide's own strategies never run.
overwriteGetLocale(() => useLocaleStore.getState().locale);

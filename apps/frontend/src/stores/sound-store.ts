import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { defaultPack, soundPacks } from "@/audio/sound-packs";
import { safeStorage } from "@/lib/safe-storage";

// What is stored, checked on load: a value from an older version or edited by hand is dropped.
const SoundSettingsSchema = Type.Object({
  pack: Type.Union([...soundPacks.map((pack) => Type.Literal(pack.id)), Type.Literal("off")]),
  volume: Type.Number({ minimum: 0, maximum: 1 }),
});

// A Sound pack, or "off" for no typing sound at all. The volume goes from 0 to 1.
export type SoundSettings = Static<typeof SoundSettingsSchema>;

export type SoundChoice = SoundSettings["pack"];

type SoundStore = SoundSettings & {
  setPack: (pack: SoundChoice) => void;
  setVolume: (volume: number) => void;
};

// Sound on at medium volume, for a first visit to hear it.
const defaults: SoundSettings = { pack: defaultPack.id, volume: 0.5 };

// The settings alone, without the actions.
const soundSettingsOf = ({ pack, volume }: SoundSettings): SoundSettings => ({ pack, volume });

// The sound settings, a preference of this browser: kept in localStorage, never sent to the
// server. Apart from the Run settings on purpose: changing the sound never starts a new Run.
export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      ...defaults,
      setPack: (pack) => set({ pack }),
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: "typomaniac-sound",
      version: 1,
      storage: createJSONStorage(() => safeStorage(() => window.localStorage)),
      partialize: (state) => soundSettingsOf(state),
      // All or nothing: stored settings that do not check out give the defaults back.
      merge: (stored, current) =>
        Value.Check(SoundSettingsSchema, stored)
          ? { ...current, ...soundSettingsOf(stored) }
          : current,
    },
  ),
);

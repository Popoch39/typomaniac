import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { safeStorage } from "@/lib/safe-storage";

// What is stored, checked on load: a value from an older version or edited by hand is dropped.
const FaceOffSoundSchema = Type.Object({ muted: Type.Boolean() });

type FaceOffSoundStore = {
  muted: boolean;
  toggleMuted: () => void;
};

// The Face-off's mute, a preference of this browser kept from one Duel to the next: in
// localStorage, never sent to the server. Apart from the typing sound on purpose: muting the
// Face-off never silences the keys. Sound on by default.
export const useFaceOffSoundStore = create<FaceOffSoundStore>()(
  persist(
    (set) => ({
      muted: false,
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
    }),
    {
      name: "typomaniac-face-off-sound",
      version: 1,
      storage: createJSONStorage(() => safeStorage(() => window.localStorage)),
      partialize: ({ muted }) => ({ muted }),
      merge: (stored, current) =>
        Value.Check(FaceOffSoundSchema, stored) ? { ...current, muted: stored.muted } : current,
    },
  ),
);

import { create } from "zustand";

import { hasDuelInProgress } from "@/lib/duel-in-progress";

export type Play = "solo" | "duel";

type PlayStore = {
  play: Play;
  setPlay: (play: Play) => void;
};

// Solo or Duel. Not persisted: every visit starts in Solo, but a reload in the middle of a Duel
// reopens it.
export const usePlayStore = create<PlayStore>()((set) => ({
  play: hasDuelInProgress() ? "duel" : "solo",
  setPlay: (play) => set({ play }),
}));

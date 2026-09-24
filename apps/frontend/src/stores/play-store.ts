import { create } from "zustand";

export type Play = "solo" | "duel";

type PlayStore = {
  play: Play;
  setPlay: (play: Play) => void;
};

// Solo or Duel. Not persisted: every visit starts in Solo.
export const usePlayStore = create<PlayStore>()((set) => ({
  play: "solo",
  setPlay: (play) => set({ play }),
}));

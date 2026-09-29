import { create } from "zustand";

export type Play = "solo" | "duel";

type PlayStore = {
  play: Play;
  setPlay: (play: Play) => void;
};

// Solo or Duel, on the play page. Not persisted: every visit starts in Solo. A Duel in play has its
// own URL, which a reload resumes.
export const usePlayStore = create<PlayStore>()((set) => ({
  play: "solo",
  setPlay: (play) => set({ play }),
}));

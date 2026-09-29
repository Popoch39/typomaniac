import { create } from "zustand";

export type Play = "solo" | "duel";

type PlayStore = {
  play: Play;
  setPlay: (play: Play) => void;
};

// Duel once the search is launched in this tab (Lancer la recherche, on Jouer's Ranked card): its
// Queue is held on every page (DuelPlace), and Jouer shows it in place of the cards, until Annuler
// or Retour au Solo, back to Solo. Not persisted: every visit starts in Solo. A Duel in play has
// its own URL, which a reload resumes.
export const usePlayStore = create<PlayStore>()((set) => ({
  play: "solo",
  setPlay: (play) => set({ play }),
}));

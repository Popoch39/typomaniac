import { create } from "zustand";

type IntroStore = {
  // The Intro plays: decided once as the page starts (`introAtStartup`), never by a navigation.
  playing: boolean;
  // The router has rendered the page the app opened on: the sidebar and the page are there to land
  // in (or the error of a start that fails).
  shellReady: boolean;
  play: () => void;
  markShellReady: () => void;
  end: () => void;
};

// The Intro's two moments that render: the shell ready, then its end. Everything in between is
// GSAP's, on the overlay.
export const useIntroStore = create<IntroStore>()((set) => ({
  playing: false,
  shellReady: false,
  play: () => set({ playing: true, shellReady: false }),
  markShellReady: () => set({ shellReady: true }),
  end: () => set({ playing: false }),
}));

// Runs `show` once the Intro is over (at once when none plays): what would open over it (a toast)
// waits for the app to be there.
export const afterIntro = (show: () => void) => {
  if (!useIntroStore.getState().playing) {
    show();

    return;
  }

  const unsubscribe = useIntroStore.subscribe((store) => {
    if (!store.playing) {
      unsubscribe();
      show();
    }
  });
};

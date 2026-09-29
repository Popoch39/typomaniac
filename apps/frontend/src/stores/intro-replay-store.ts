import { create } from "zustand";

// Dev build only: the options of /dev/intro, which replays the Intro on the real shell (see
// components/intro-dev/intro-replay). Only dev code reads this store, or behind
// `import.meta.env.DEV`.

// How fast the replayed Intro plays, to look at each of its times.
export const INTRO_SPEEDS = [0.25, 0.5, 1, 1.5, 2] as const;

// How late the shell is, counted from the waiting point: how long the caret waits for it.
export const SHELL_DELAYS = [0, 2, 5] as const;

export type IntroSpeed = (typeof INTRO_SPEEDS)[number];

export type ShellDelay = (typeof SHELL_DELAYS)[number];

type IntroReplayStore = {
  speed: IntroSpeed;
  shellDelay: ShellDelay;
  // An Intro replayed from /dev/intro plays: its options hold until it ends.
  replaying: boolean;
  setSpeed: (speed: IntroSpeed) => void;
  setShellDelay: (shellDelay: ShellDelay) => void;
};

// The page's options, kept while the app is open: the replay leaves the page, and comes back to it.
// Pure: once nothing reads it (the production build), the store is dropped with its module.
export const useIntroReplayStore = /* @__PURE__ */ create<IntroReplayStore>()((set) => ({
  speed: 1,
  shellDelay: 0,
  replaying: false,
  setSpeed: (speed) => set({ speed }),
  setShellDelay: (shellDelay) => set({ shellDelay }),
}));

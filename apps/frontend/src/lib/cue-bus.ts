import type { Cue } from "typing-engine";

type Listener = (cues: readonly Cue[]) => void;

const listeners = new Set<Listener>();

// Hands the Cues of a Keystroke to every reactor, sound or visual, outside of React (ADR 0006).
export const emitCues = (cues: readonly Cue[]) => {
  for (const listener of listeners) {
    listener(cues);
  }
};

// Returns the unsubscribe.
export const onCues = (listener: Listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

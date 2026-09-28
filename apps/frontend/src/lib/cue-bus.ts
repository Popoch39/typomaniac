import type { Cue } from "typing-engine";

// What one Keystroke caused, and when, in ms since the start of the Run or the Duel, and the
// player's Score right after it.
export type KeystrokeCues = { at: number; cues: readonly Cue[]; score: number };

// No Keystroke yet in a Run or a Duel.
export const NO_CUES: KeystrokeCues = { at: 0, cues: [], score: 0 };

type Listener = (keystroke: KeystrokeCues) => void;

// One channel of the bus: what it is handed goes to every reactor listening to it, outside of
// React. `on` returns the unsubscribe.
const cueChannel = () => {
  const listeners = new Set<Listener>();

  const emit = (keystroke: KeystrokeCues) => {
    for (const listener of listeners) {
      listener(keystroke);
    }
  };

  const on = (listener: Listener) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  return { emit, on };
};

const own = cueChannel();

const opponent = cueChannel();

// The User's Keystrokes, in a Run or a Duel: for every reactor, sound or visual (ADR 0006).
export const emitCues = own.emit;

export const onCues = own.on;

// The opponent's Keystrokes in a Duel, stamped at their reception: for the visual reactors only,
// never a sound (ADR 0010).
export const emitOpponentCues = opponent.emit;

export const onOpponentCues = opponent.on;

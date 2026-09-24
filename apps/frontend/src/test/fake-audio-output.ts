import type { AudioOutput } from "@/audio/audio-engine";

export type Played = { url: string; detune: number; gain: number };

// An audio output for the tests: it decodes every file at once, or never, and writes down what it
// plays.
export const fakeOutput = ({ decodes = true } = {}) => {
  const played: Played[] = [];
  const state = { volume: 1, resumed: 0 };

  const output: AudioOutput<string> = {
    decode: (url) => (decodes ? Promise.resolve(url) : new Promise<string>(() => {})),
    play: (url, playback) => {
      played.push({ url, ...playback });
    },
    resume: () => {
      state.resumed++;
    },
    setVolume: (volume) => {
      state.volume = volume;
    },
  };

  return { output, played, state };
};

// The decoding of the pack is asynchronous: lets it settle before typing.
export const decoded = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mid-range randomness: the 7th of the 12 key variants, not detuned.
export const middle = () => 0.5;

// What the tactile pack plays at mid-range randomness.
export const key07 = { url: "/sounds/tactile/key-07.mp3", detune: 0, gain: 1 };

export const space = { url: "/sounds/tactile/key-05.mp3", detune: -300, gain: 1 };

export const error = { url: "/sounds/tactile/error.mp3", detune: 0, gain: 0.5 };

export const backspace = { url: "/sounds/tactile/backspace.mp3", detune: 0, gain: 0.9 };

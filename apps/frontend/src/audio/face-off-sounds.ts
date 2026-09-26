import { synthesize } from "@/audio/face-off-synth";

// The Face-off's highlights, each with its sound: the panels coming in, their impact, each digit
// of the 3-2-1, GO. And, before it, the Match proposal arriving; after the Duel, a move up into a
// new Tier or Maître.
export type FaceOffSound = "whoosh" | "impact" | "beep" | "go" | "proposal" | "rank-up";

// What the Face-off plays through: Web Audio in the browser, a fake in the tests.
export type FaceOffSounds = {
  // Browsers only let audio start from a user gesture: called on the click that searches for a
  // Duel or accepts a Challenge, before any Face-off.
  unlock: () => void;
  // Fire and forget: nothing plays before the audio is unlocked.
  play: (sound: FaceOffSound) => void;
};

export const silentFaceOffSounds: FaceOffSounds = { unlock: () => {}, play: () => {} };

// The level of every Face-off sound: apart from the typing volume, which is the keys' own.
const LEVEL = 0.5;

// Null when the browser refuses the context.
const attempt = <T>(create: () => T) => {
  try {
    return create();
  } catch {
    return null;
  }
};

// A refused resume leaves the context locked: its sounds keep being dropped.
const resume = (context: AudioContext) => context.resume().catch(() => {});

// The Face-off's sounds, synthesized with Web Audio: no audio file. The context is only created
// when first needed, from the unlock if the User clicked before the Face-off. Without Web Audio,
// or with a context refused, the Face-off stays silent.
export const openFaceOffSounds = (): FaceOffSounds => {
  let playing: { context: AudioContext; master: GainNode } | null = null;
  let refused = typeof AudioContext === "undefined";

  const player = () => {
    if (playing === null && !refused) {
      const context = attempt(() => new AudioContext());

      refused = context === null;

      if (context !== null) {
        const master = context.createGain();

        master.gain.value = LEVEL;
        master.connect(context.destination);
        playing = { context, master };
      }
    }

    return playing;
  };

  return {
    unlock: () => {
      const target = player();

      if (target?.context.state === "suspended") {
        void resume(target.context);
      }
    },
    // A context still locked would hold the sound and play it late, once unlocked: it is dropped,
    // and the context asked to resume for the next ones.
    play: (sound) => {
      const target = player();

      if (target === null) {
        return;
      }

      if (target.context.state !== "running") {
        void resume(target.context);

        return;
      }

      synthesize(target.context, target.master, sound);
    },
  };
};

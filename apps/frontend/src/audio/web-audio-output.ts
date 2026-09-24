import type { AudioOutput } from "@/audio/audio-engine";

// Decoded files are resampled to this rate, the one the Sound packs are prepared at.
const sampleRate = 44_100;

// Null when the browser refuses the context.
const attempt = <T>(create: () => T) => {
  try {
    return create();
  } catch {
    return null;
  }
};

// The browser's Web Audio, behind a master gain for the volume. Null without Web Audio: the game
// then goes on in silence. Files are decoded offline, so the page can load them before any key;
// the context that plays them is only created with the first sound, from the User's first key
// (autoplay policy). A refused context stays silent too.
export const openWebAudio = (): AudioOutput<AudioBuffer> | null => {
  if (typeof AudioContext === "undefined" || typeof OfflineAudioContext === "undefined") {
    return null;
  }

  const decoder = attempt(() => new OfflineAudioContext(1, 1, sampleRate));
  let volume = 1;
  let playing: { context: AudioContext; master: GainNode } | null = null;
  let refused = false;

  const player = () => {
    if (playing === null && !refused) {
      const context = attempt(() => new AudioContext());

      refused = context === null;

      if (context !== null) {
        const master = context.createGain();

        master.gain.value = volume;
        master.connect(context.destination);
        playing = { context, master };
      }
    }

    return playing;
  };

  return {
    decode: async (url) => {
      if (decoder === null) {
        throw new Error("No audio decoder");
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Sound ${url}: HTTP ${response.status}`);
      }

      return decoder.decodeAudioData(await response.arrayBuffer());
    },
    // One source per sound, dropped once it has played.
    play: (buffer, { detune, gain }) => {
      const target = player();

      if (target === null) {
        return;
      }

      const source = target.context.createBufferSource();
      const level = target.context.createGain();

      source.buffer = buffer;
      source.detune.value = detune;
      level.gain.value = gain;
      source.connect(level).connect(target.master);
      source.start();
    },
    resume: () => {
      const target = player();

      if (target?.context.state === "suspended") {
        target.context.resume().catch(() => {});
      }
    },
    setVolume: (next) => {
      volume = next;

      if (playing !== null) {
        playing.master.gain.value = next;
      }
    },
  };
};

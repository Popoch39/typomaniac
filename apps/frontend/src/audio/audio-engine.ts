// How one sound is played: its pitch shift in cents and its own gain, under the master volume.
export type Playback = { detune: number; gain: number };

// What the engine plays through: Web Audio in the browser, a fake in the tests. `Decoded` is a
// decoded file.
export type AudioOutput<Decoded> = {
  decode: (url: string) => Promise<Decoded>;
  play: (sound: Decoded, playback: Playback) => void;
  // Browsers only let audio start from a user gesture: called on every sound played.
  resume: () => void;
  setVolume: (volume: number) => void;
};

export type AudioEngine = {
  preload: (urls: readonly string[]) => Promise<void>;
  // Fire and forget: a sound whose file is not decoded yet is skipped, never waited for.
  play: (url: string, playback: Playback) => void;
  setVolume: (volume: number) => void;
};

// `open` gives the output, or null without Web Audio: everything is then silent. It is called
// once, the first time the engine needs it.
export const createAudioEngine = <Decoded>(
  open: () => AudioOutput<Decoded> | null,
): AudioEngine => {
  let output: AudioOutput<Decoded> | null = null;
  let opened = false;
  let volume = 1;
  const decoded = new Map<string, Decoded>();
  const loading = new Map<string, Promise<void>>();

  const outputOf = () => {
    if (!opened) {
      opened = true;
      output = open();
      output?.setVolume(volume);
    }

    return output;
  };

  // A file that fails to load or decode stays silent.
  const load = (target: AudioOutput<Decoded>, url: string) =>
    target.decode(url).then(
      (sound) => {
        decoded.set(url, sound);
      },
      () => {},
    );

  return {
    preload: async (urls) => {
      const target = outputOf();

      if (target === null) {
        return;
      }

      for (const url of urls) {
        if (!loading.has(url)) {
          loading.set(url, load(target, url));
        }
      }

      await Promise.all(urls.map((url) => loading.get(url)));
    },
    play: (url, playback) => {
      const target = outputOf();
      const sound = decoded.get(url);

      if (target === null || typeof sound === "undefined") {
        return;
      }

      target.resume();
      target.play(sound, playback);
    },
    setVolume: (next) => {
      volume = next;
      output?.setVolume(next);
    },
  };
};

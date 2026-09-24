import type { Cue } from "typing-engine";

import type { AudioEngine } from "@/audio/audio-engine";
import { packOf, type Sound, type SoundPack, soundsOf } from "@/audio/sound-packs";
import { onCues } from "@/lib/cue-bus";
import { type SoundChoice, useSoundStore } from "@/stores/sound-store";

// How far, in cents, a key is detuned at random either way.
const detuneRange = 50;

type Random = () => number;

const play = (engine: AudioEngine, sound: Sound, detune = 0) =>
  engine.play(sound.url, { detune: sound.detune + detune, gain: sound.gain });

// The space of the pack, or one of its keys at random, detuned at random.
const playKey = (engine: AudioEngine, pack: SoundPack, char: string, random: Random) => {
  if (char === " ") {
    play(engine, pack.space);

    return;
  }

  const sound = pack.keys[Math.floor(random() * pack.keys.length)] ?? pack.keys[0];

  play(engine, sound, (random() * 2 - 1) * detuneRange);
};

// The Cues of the word, the Combo and the Burst play nothing yet: the place for their sounds.
const playCue = (engine: AudioEngine, pack: SoundPack, cue: Cue, random: Random) => {
  switch (cue.kind) {
    case "hit":
      playKey(engine, pack, cue.char, random);
      break;
    case "miss":
      playKey(engine, pack, cue.char, random);
      play(engine, pack.error);
      break;
    case "erase":
      play(engine, pack.backspace);
      break;
  }
};

// Loads the files of the pack, so its first key sounds. "off" loads nothing.
const preloadChoice = (engine: AudioEngine, choice: SoundChoice) =>
  choice === "off"
    ? Promise.resolve()
    : engine.preload(soundsOf(packOf(choice)).map((sound) => sound.url));

// Plays the Cues of the User's Keystrokes, once started at the app startup, with the sound
// settings of the moment: a new pack is loaded as soon as it is chosen. Returns the stop.
export const startSoundReactor = (
  engine: AudioEngine,
  { random = Math.random }: { random?: Random } = {},
) => {
  const { pack, volume } = useSoundStore.getState();

  engine.setVolume(volume);
  void preloadChoice(engine, pack);

  const stopSettings = useSoundStore.subscribe((settings, previous) => {
    if (settings.volume !== previous.volume) {
      engine.setVolume(settings.volume);
    }

    if (settings.pack !== previous.pack) {
      void preloadChoice(engine, settings.pack);
    }
  });

  const stopCues = onCues((cues) => {
    const choice = useSoundStore.getState().pack;

    if (choice === "off") {
      return;
    }

    for (const cue of cues) {
      playCue(engine, packOf(choice), cue, random);
    }
  });

  return () => {
    stopCues();
    stopSettings();
  };
};

// A key of the pack, to hear it from the picker: loaded first if need be. "off" plays nothing.
export const previewSound = (
  engine: AudioEngine,
  choice: SoundChoice,
  random: Random = Math.random,
) => {
  if (choice === "off") {
    return;
  }

  void preloadChoice(engine, choice).then(() => playKey(engine, packOf(choice), "k", random));
};

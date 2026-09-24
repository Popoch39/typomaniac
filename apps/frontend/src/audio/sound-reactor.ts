import type { Cue } from "typing-engine";

import type { AudioEngine } from "@/audio/audio-engine";
import {
  defaultPack,
  defaultVolume,
  type Sound,
  type SoundPack,
  soundsOf,
} from "@/audio/sound-packs";
import { onCues } from "@/lib/cue-bus";

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

// Plays the Cues of the User's Keystrokes, once started at the app startup. Returns the stop.
export const startSoundReactor = (
  engine: AudioEngine,
  { random = Math.random }: { random?: Random } = {},
) => {
  const pack = defaultPack;

  engine.setVolume(defaultVolume);
  void engine.preload(soundsOf(pack).map((sound) => sound.url));

  return onCues((cues) => {
    for (const cue of cues) {
      playCue(engine, pack, cue, random);
    }
  });
};

import type { Playback } from "@/audio/audio-engine";

// One file of a Sound pack, with how it plays: `gain` levels it with the others, `detune` (in
// cents) plays it higher or lower than recorded.
export type Sound = { url: string } & Playback;

export type SoundPack = {
  id: "tactile";
  label: string;
  credit: string;
  // Drawn at random for every key, so two keys in a row never sound quite the same.
  keys: readonly [Sound, ...Sound[]];
  space: Sound;
  backspace: Sound;
  // Played over the key on a mistake.
  error: Sound;
};

const key = (pack: string, n: number): Sound => ({
  url: `/sounds/${pack}/key-${String(n).padStart(2, "0")}.mp3`,
  gain: 1,
  detune: 0,
});

// The files and their credits are in public/sounds/tactile. Adding a pack: a folder of files and
// an entry here.
const tactile: SoundPack = {
  id: "tactile",
  label: "Tactile",
  credit: "StavSounds, alpinemesh, Foxfire- (Freesound), Kenney. CC0",
  keys: [key("tactile", 1), ...Array.from({ length: 11 }, (_, i) => key("tactile", i + 2))],
  // No real space bar in the pack: one of its keys, played lower.
  space: { ...key("tactile", 5), detune: -300 },
  backspace: { url: "/sounds/tactile/backspace.mp3", gain: 0.9, detune: 0 },
  error: { url: "/sounds/tactile/error.mp3", gain: 0.5, detune: 0 },
};

export const defaultPack = tactile;

// Medium volume, from 0 to 1.
export const defaultVolume = 0.5;

export const soundsOf = (pack: SoundPack) => [...pack.keys, pack.space, pack.backspace, pack.error];

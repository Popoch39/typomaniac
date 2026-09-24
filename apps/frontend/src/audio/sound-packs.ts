import type { Playback } from "@/audio/audio-engine";

// One file of a Sound pack, with how it plays: `gain` levels it with the others, `detune` (in
// cents) plays it higher or lower than recorded.
export type Sound = { url: string } & Playback;

export type SoundPack = {
  id: "tactile" | "typewriter" | "office" | "keyboard";
  label: string;
  credit: string;
  // Drawn at random for every key, so two keys in a row never sound quite the same.
  keys: readonly [Sound, ...Sound[]];
  // How far, in cents, a key is detuned at random either way.
  detuneRange: number;
  // Drawn at random for every space, never detuned.
  spaces: readonly [Sound, ...Sound[]];
  backspace: Sound;
  // Played over the key on a mistake.
  error: Sound;
};

const sound = (url: string, gain = 1, detune = 0): Sound => ({ url, gain, detune });

const numbered = (pack: string, name: string, n: number) =>
  `/sounds/${pack}/${name}-${String(n).padStart(2, "0")}.mp3`;

// The keys key-01 to key-`count` of the pack, all at the same gain.
const keysOf = (pack: string, count: number, gain = 1): SoundPack["keys"] => [
  sound(numbered(pack, "key", 1), gain),
  ...Array.from({ length: count - 1 }, (_, i) => sound(numbered(pack, "key", i + 2), gain)),
];

// The files and their credits are in public/sounds/<pack>. Adding a pack: a folder of files and
// an entry here. The gains level the packs with tactile, the reference at 1.
const tactile: SoundPack = {
  id: "tactile",
  label: "Tactile",
  credit: "StavSounds, alpinemesh, Foxfire- (Freesound), Kenney. CC0",
  keys: keysOf("tactile", 12),
  detuneRange: 50,
  // No real space bar in the pack: one of its keys, played lower.
  spaces: [sound(numbered("tactile", "key", 5), 1, -300)],
  backspace: sound("/sounds/tactile/backspace.mp3", 0.9),
  error: sound("/sounds/tactile/error.mp3", 0.5),
};

// Only 3 keys: detuned wider so they do not repeat. The backspace is a carriage return.
const typewriter: SoundPack = {
  id: "typewriter",
  label: "Typewriter",
  credit: "yottasounds, knufds (Freesound), Kenney. CC0",
  keys: keysOf("typewriter", 3, 0.55),
  detuneRange: 100,
  spaces: [sound(numbered("typewriter", "key", 2), 0.55, -300)],
  backspace: sound("/sounds/typewriter/backspace.mp3", 0.75),
  error: sound("/sounds/typewriter/error.mp3", 0.4),
};

// No space bar nor backspace in the pack: two of its keys, played lower.
const office: SoundPack = {
  id: "office",
  label: "Office",
  credit: "unicaegames (OpenGameArt), Kenney. CC0",
  keys: keysOf("office", 12),
  detuneRange: 50,
  spaces: [sound(numbered("office", "key", 5), 1, -300)],
  backspace: sound(numbered("office", "key", 9), 0.8, -500),
  error: sound("/sounds/office/error.mp3", 0.4),
};

// Two real space bars, and its shift as the backspace.
const keyboard: SoundPack = {
  id: "keyboard",
  label: "Keyboard",
  credit: "yottasounds (Freesound), Kenney. CC0",
  keys: keysOf("keyboard", 4, 1.2),
  detuneRange: 50,
  spaces: [
    sound(numbered("keyboard", "space", 1), 1.2),
    sound(numbered("keyboard", "space", 2), 1.2),
  ],
  backspace: sound("/sounds/keyboard/backspace.mp3", 0.8),
  error: sound("/sounds/keyboard/error.mp3", 0.45),
};

// Every pack the User can pick, in the order of the picker.
export const soundPacks: readonly [SoundPack, ...SoundPack[]] = [
  tactile,
  typewriter,
  office,
  keyboard,
];

export const defaultPack = tactile;

export const packOf = (id: SoundPack["id"]) =>
  soundPacks.find((pack) => pack.id === id) ?? defaultPack;

export const soundsOf = (pack: SoundPack) => [
  ...pack.keys,
  ...pack.spaces,
  pack.backspace,
  pack.error,
];

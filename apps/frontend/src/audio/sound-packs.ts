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

// The file `name` of the pack, in public/sounds/<pack>.
const file = (
  pack: SoundPack["id"],
  name: string,
  { gain = 1, detune = 0 }: Partial<Playback> = {},
): Sound => ({ url: `/sounds/${pack}/${name}.mp3`, gain, detune });

// The name of the `n`th file of a series: key-01, key-02…
const nth = (series: string, n: number) => `${series}-${String(n).padStart(2, "0")}`;

// The keys key-01 to key-`count` of the pack, all at the same gain.
const keysOf = (pack: SoundPack["id"], count: number, gain = 1): SoundPack["keys"] => [
  file(pack, nth("key", 1), { gain }),
  ...Array.from({ length: count - 1 }, (_, i) => file(pack, nth("key", i + 2), { gain })),
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
  spaces: [file("tactile", nth("key", 5), { detune: -300 })],
  backspace: file("tactile", "backspace", { gain: 0.9 }),
  error: file("tactile", "error", { gain: 0.5 }),
};

// Only 3 keys: detuned wider so they do not repeat. The backspace is a carriage return.
const typewriter: SoundPack = {
  id: "typewriter",
  label: "Typewriter",
  credit: "yottasounds, knufds (Freesound), Kenney. CC0",
  keys: keysOf("typewriter", 3, 0.55),
  detuneRange: 100,
  spaces: [file("typewriter", nth("key", 2), { gain: 0.55, detune: -300 })],
  backspace: file("typewriter", "backspace", { gain: 0.75 }),
  error: file("typewriter", "error", { gain: 0.4 }),
};

// No space bar nor backspace in the pack: two of its keys, played lower.
const office: SoundPack = {
  id: "office",
  label: "Office",
  credit: "unicaegames (OpenGameArt), Kenney. CC0",
  keys: keysOf("office", 12),
  detuneRange: 50,
  spaces: [file("office", nth("key", 5), { detune: -300 })],
  backspace: file("office", nth("key", 9), { gain: 0.8, detune: -500 }),
  error: file("office", "error", { gain: 0.4 }),
};

// Two real space bars, and its shift as the backspace.
const keyboard: SoundPack = {
  id: "keyboard",
  label: "Keyboard",
  credit: "yottasounds (Freesound), Kenney. CC0",
  keys: keysOf("keyboard", 4, 1.2),
  detuneRange: 50,
  spaces: [
    file("keyboard", nth("space", 1), { gain: 1.2 }),
    file("keyboard", nth("space", 2), { gain: 1.2 }),
  ],
  backspace: file("keyboard", "backspace", { gain: 0.8 }),
  error: file("keyboard", "error", { gain: 0.45 }),
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

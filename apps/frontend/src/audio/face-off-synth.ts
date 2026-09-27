import type { FaceOffSound } from "@/audio/face-off-sounds";

// The parts of Web Audio the synth builds its sounds with: a browser's AudioContext has them all,
// and a test fakes only these.
export type SynthParam = {
  value: number;
  setValueAtTime(value: number, at: number): void;
  exponentialRampToValueAtTime(value: number, at: number): void;
};

export type SynthNode = { connect(destination: SynthNode): SynthNode };

export type SynthSource = SynthNode & { start(at: number): void; stop(at: number): void };

export type SynthBuffer = { getChannelData(channel: number): Float32Array };

type SynthContext = {
  readonly currentTime: number;
  readonly sampleRate: number;
  createGain(): SynthNode & { gain: SynthParam };
  createOscillator(): SynthSource & { type: OscillatorType; frequency: SynthParam };
  createBiquadFilter(): SynthNode & {
    type: BiquadFilterType;
    frequency: SynthParam;
    Q: SynthParam;
  };
  createBufferSource(): SynthSource & { buffer: SynthBuffer | null };
  createBuffer(channels: number, length: number, sampleRate: number): SynthBuffer;
};

// The context the Face-off plays through: it is locked until a gesture resumes it.
export type FaceOffAudioContext = SynthContext & {
  state: AudioContextState;
  readonly destination: SynthNode;
  resume(): Promise<void>;
};

// Where and when a sound plays: every node of it is built on `context`, starts at `at` and ends in
// `destination`.
type Voice = { context: SynthContext; destination: SynthNode; at: number };

// A level rising to `peak` in `attack` seconds, then dying away in `release`.
type Envelope = { peak: number; attack: number; release: number };

// The quietest level of an envelope: an exponential ramp never reaches 0.
const SILENT = 0.0001;

// A source stops this long after its envelope has died away.
const TAIL_S = 0.02;

// White noise, drawn once per context, long enough for the longest noisy sound.
const NOISE_S = 1;

const noises = new WeakMap<SynthContext, SynthBuffer>();

const noiseOf = (context: SynthContext) => {
  const cached = noises.get(context);

  if (typeof cached !== "undefined") {
    return cached;
  }

  const buffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * NOISE_S),
    context.sampleRate,
  );

  const samples = buffer.getChannelData(0);

  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.random() * 2 - 1;
  }

  noises.set(context, buffer);

  return buffer;
};

// The same voice, `delay` seconds later.
const later = (voice: Voice, delay: number): Voice => ({ ...voice, at: voice.at + delay });

// Plays `source` through `through`, then a gain shaped by `envelope`, into the voice's
// destination: stopped once the envelope has died away.
const sound = (
  { context, destination, at }: Voice,
  source: SynthSource,
  through: SynthNode,
  { peak, attack, release }: Envelope,
) => {
  const level = context.createGain();

  level.gain.setValueAtTime(SILENT, at);
  level.gain.exponentialRampToValueAtTime(peak, at + attack);
  level.gain.exponentialRampToValueAtTime(SILENT, at + attack + release);
  through.connect(level).connect(destination);
  source.start(at);
  source.stop(at + attack + release + TAIL_S);
};

type Filter = ReturnType<SynthContext["createBiquadFilter"]>;

// Noise through `filter`.
const noiseBurst = (voice: Voice, filter: Filter, envelope: Envelope) => {
  const source = voice.context.createBufferSource();

  source.buffer = noiseOf(voice.context);
  source.connect(filter);
  sound(voice, source, filter, envelope);
};

// A filter of `type` at `frequency` Hz, built for `voice`.
const filterOf = (voice: Voice, type: BiquadFilterType, frequency: number) => {
  const filter = voice.context.createBiquadFilter();

  filter.type = type;
  filter.frequency.setValueAtTime(frequency, voice.at);

  return filter;
};

type Pitch = { type: OscillatorType; from: number; to?: number; glide?: number };

// A tone of `type`, gliding from `from` to `to` Hz over `glide` seconds.
const tone = (voice: Voice, { type, from, to = from, glide = 0 }: Pitch, envelope: Envelope) => {
  const oscillator = voice.context.createOscillator();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, voice.at);

  if (glide > 0) {
    oscillator.frequency.exponentialRampToValueAtTime(to, voice.at + glide);
  }

  sound(voice, oscillator, oscillator, envelope);
};

// The panels coming in: noise rising in pitch and level up to their impact, 0.35 s later.
const whoosh = (voice: Voice) => {
  const filter = filterOf(voice, "bandpass", 300);

  filter.Q.value = 1.4;
  filter.frequency.exponentialRampToValueAtTime(2600, voice.at + 0.35);
  noiseBurst(voice, filter, { peak: 0.9, attack: 0.32, release: 0.08 });
};

// The panels meeting: a low thump falling in pitch, under a short crack of muffled noise.
const impact = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 150, to: 42, glide: 0.3 },
    { peak: 1, attack: 0.005, release: 0.5 },
  );
  noiseBurst(voice, filterOf(voice, "lowpass", 1400), { peak: 0.7, attack: 0.002, release: 0.16 });
};

// A digit of the 3-2-1: a short, bright beep.
const beep = (voice: Voice) =>
  tone(voice, { type: "square", from: 660 }, { peak: 0.22, attack: 0.004, release: 0.14 });

// GO: an octave above the beeps, with its fifth, held longer.
const go = (voice: Voice) => {
  tone(voice, { type: "square", from: 1320 }, { peak: 0.2, attack: 0.004, release: 0.45 });
  tone(voice, { type: "triangle", from: 1980 }, { peak: 0.25, attack: 0.004, release: 0.4 });
};

// A Match proposal arriving: a rising chime of two bells, a fifth apart, to call back a User
// looking elsewhere.
const proposal = (voice: Voice) => {
  const bell: Envelope = { peak: 0.35, attack: 0.006, release: 0.5 };

  tone(voice, { type: "triangle", from: 880 }, bell);
  tone(later(voice, 0.14), { type: "triangle", from: 1320 }, bell);
};

// The iron shield dissolving into light over half a second: airy noise brightening as it fades,
// over a soft tone sinking away.
const bronzeDissolve = (voice: Voice) => {
  const filter = filterOf(voice, "bandpass", 1600);

  filter.Q.value = 0.9;
  filter.frequency.exponentialRampToValueAtTime(6000, voice.at + 0.55);
  noiseBurst(voice, filter, { peak: 0.45, attack: 0.35, release: 0.3 });
  tone(
    voice,
    { type: "sine", from: 330, to: 150, glide: 0.5 },
    { peak: 0.16, attack: 0.05, release: 0.5 },
  );
};

// The partials of the bronze ringing as it lands, in Hz, with their envelopes: a warm G, then two
// inharmonic overtones dying away sooner, as struck metal does.
const BRONZE_RING: readonly [OscillatorType, number, Envelope][] = [
  ["triangle", 392, { peak: 0.3, attack: 0.004, release: 1.4 }],
  ["sine", 988, { peak: 0.12, attack: 0.003, release: 0.8 }],
  ["sine", 1567, { peak: 0.07, attack: 0.002, release: 0.45 }],
];

// The bronze Blason landing: a heavy thump, a crack of noise, then the metal ringing.
const bronzeImpact = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 130, to: 45, glide: 0.35 },
    { peak: 1, attack: 0.005, release: 0.6 },
  );
  noiseBurst(voice, filterOf(voice, "lowpass", 2200), { peak: 0.6, attack: 0.002, release: 0.18 });

  for (const [type, from, envelope] of BRONZE_RING) {
    tone(voice, { type, from }, envelope);
  }
};

// The notes under the name coming in letter by letter, in Hz: a G major arpeggio over two
// octaves, one note a letter.
const NAME_NOTES = [392, 493.88, 587.33, 783.99, 987.77, 1174.66];

// Seconds between two letters of the name.
const LETTER_STEP_S = 0.05;

// The name of Bronze, letter by letter: a quick rising arpeggio of plucks, its last note held,
// then a bright shimmer.
const bronzeName = (voice: Voice) => {
  for (const [step, note] of NAME_NOTES.entries()) {
    const last = step === NAME_NOTES.length - 1;

    tone(
      later(voice, step * LETTER_STEP_S),
      { type: "triangle", from: note },
      { peak: 0.16, attack: 0.005, release: last ? 0.9 : 0.25 },
    );
  }

  const end = later(voice, (NAME_NOTES.length - 1) * LETTER_STEP_S);

  noiseBurst(end, filterOf(end, "highpass", 5000), { peak: 0.1, attack: 0.03, release: 0.45 });
};

// A snap of bright noise, a few milliseconds long: metal cracking.
const snap = (voice: Voice, frequency: number, peak: number) =>
  noiseBurst(voice, filterOf(voice, "highpass", frequency), { peak, attack: 0.001, release: 0.07 });

// The bronze shield cracking, then splitting in two a tenth of a second later: two snaps, then
// the halves grinding apart, the noise falling as they part, over a low groan.
const argentCrack = (voice: Voice) => {
  snap(voice, 3200, 0.8);
  snap(later(voice, 0.04), 5200, 0.4);

  const split = later(voice, 0.1);
  const grind = filterOf(split, "bandpass", 2800);

  grind.Q.value = 2.2;
  grind.frequency.exponentialRampToValueAtTime(500, split.at + 0.7);
  noiseBurst(split, grind, { peak: 0.5, attack: 0.02, release: 0.68 });
  tone(
    split,
    { type: "sawtooth", from: 180, to: 70, glide: 0.6 },
    { peak: 0.08, attack: 0.02, release: 0.6 },
  );
};

// The partials of the silver ringing as it is struck, in Hz, with their envelopes: a bright C,
// its octave, then inharmonic overtones dying away sooner, clearer and longer than the bronze.
const SILVER_RING: readonly [OscillatorType, number, Envelope][] = [
  ["triangle", 523.25, { peak: 0.26, attack: 0.003, release: 1.8 }],
  ["sine", 1046.5, { peak: 0.12, attack: 0.003, release: 1.4 }],
  ["sine", 1413, { peak: 0.08, attack: 0.002, release: 0.9 }],
  ["sine", 2637, { peak: 0.05, attack: 0.002, release: 0.6 }],
];

// A chevron stamped in the metal: a short knock with a high clink.
const argentStamp = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 260, to: 120, glide: 0.08 },
    { peak: 0.35, attack: 0.002, release: 0.12 },
  );
  tone(voice, { type: "triangle", from: 2093 }, { peak: 0.08, attack: 0.002, release: 0.25 });
};

// The Argent striking like a stamp: a deep thump under a crack of noise, the silver ringing.
const argentImpact = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 120, to: 36, glide: 0.4 },
    { peak: 1, attack: 0.004, release: 0.7 },
  );
  noiseBurst(voice, filterOf(voice, "lowpass", 3200), { peak: 0.7, attack: 0.001, release: 0.22 });

  for (const [type, from, envelope] of SILVER_RING) {
    tone(voice, { type, from }, envelope);
  }
};

// The light sweeping over the silver: airy noise brightening as it crosses the metal.
const argentSweep = (voice: Voice) => {
  const shine = filterOf(voice, "bandpass", 3000);

  shine.Q.value = 1.2;
  shine.frequency.exponentialRampToValueAtTime(9000, voice.at + 0.8);
  noiseBurst(voice, shine, { peak: 0.12, attack: 0.4, release: 0.45 });
};

// The notes under the name of Argent, in Hz: an A major arpeggio over two octaves, one note a
// letter, each doubled an octave up, softer.
const ARGENT_NOTES = [440, 554.37, 659.25, 880, 1108.73, 1318.51];

// The name of Argent, letter by letter: brighter plucks than Bronze's, each with its octave, the
// last held with its fifth, then a long shimmer.
const argentName = (voice: Voice) => {
  for (const [step, note] of ARGENT_NOTES.entries()) {
    const last = step === ARGENT_NOTES.length - 1;
    const release = last ? 1.2 : 0.3;
    const pluck = later(voice, step * LETTER_STEP_S);

    tone(pluck, { type: "triangle", from: note }, { peak: 0.15, attack: 0.004, release });
    tone(pluck, { type: "sine", from: note * 2 }, { peak: 0.05, attack: 0.004, release });
  }

  const end = later(voice, (ARGENT_NOTES.length - 1) * LETTER_STEP_S);

  tone(end, { type: "sine", from: 1975.53 }, { peak: 0.06, attack: 0.01, release: 1.1 });
  noiseBurst(end, filterOf(end, "highpass", 6000), { peak: 0.12, attack: 0.05, release: 0.8 });
};

// The silver rising into the column of light, for a second: airy noise brightening as it climbs,
// over two voices rising a fifth apart, as a choir swelling.
const orAscend = (voice: Voice) => {
  const air = filterOf(voice, "bandpass", 700);

  air.Q.value = 1.1;
  air.frequency.exponentialRampToValueAtTime(7000, voice.at + 0.9);
  noiseBurst(voice, air, { peak: 0.4, attack: 0.7, release: 0.3 });
  tone(
    voice,
    { type: "sine", from: 220, to: 587.33, glide: 0.9 },
    { peak: 0.14, attack: 0.6, release: 0.5 },
  );
  tone(
    voice,
    { type: "triangle", from: 330, to: 880, glide: 0.9 },
    { peak: 0.07, attack: 0.6, release: 0.5 },
  );
};

// The partials of the gold ringing as it materializes, in Hz, with their envelopes: a warm D, its
// fifth and its octave, then inharmonic overtones, fuller and longer than the silver.
const GOLD_RING: readonly [OscillatorType, number, Envelope][] = [
  ["triangle", 293.66, { peak: 0.24, attack: 0.004, release: 2.4 }],
  ["triangle", 440, { peak: 0.14, attack: 0.004, release: 2 }],
  ["sine", 587.33, { peak: 0.14, attack: 0.003, release: 1.9 }],
  ["sine", 1244, { peak: 0.07, attack: 0.002, release: 1.1 }],
  ["sine", 2489, { peak: 0.05, attack: 0.002, release: 0.8 }],
];

// The Or materializing in a blinding white: a deep thump shaking the screen, a burst of bright
// noise for the flash, then the gold ringing.
const orMaterialize = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 110, to: 32, glide: 0.45 },
    { peak: 1, attack: 0.004, release: 0.8 },
  );
  noiseBurst(voice, filterOf(voice, "lowpass", 4200), { peak: 0.6, attack: 0.001, release: 0.3 });
  noiseBurst(voice, filterOf(voice, "highpass", 5000), { peak: 0.18, attack: 0.01, release: 0.7 });

  for (const [type, from, envelope] of GOLD_RING) {
    tone(voice, { type, from }, envelope);
  }
};

// The notes under the name of Or, in Hz: a D major arpeggio over two octaves, each doubled an
// octave up, softer.
const OR_NOTES = [587.33, 739.99, 880, 1174.66, 1479.98, 1760];

// When the glitter tinkles after the name's last note (s), and how high (Hz): a few pieces
// catching the light as they fall.
const GLITTER_TINKLES: readonly [number, number][] = [
  [0.12, 2349.32],
  [0.27, 2959.96],
  [0.39, 3520],
  [0.56, 2637.02],
  [0.74, 3135.96],
  [0.95, 3951.07],
];

// The name of Or: a quick rising arpeggio of plucks with their octaves, richer than Argent's, the last held with its fifth over a long shimmer, then the
// glitter tinkling as it falls.
const orName = (voice: Voice) => {
  for (const [step, note] of OR_NOTES.entries()) {
    const last = step === OR_NOTES.length - 1;
    const release = last ? 1.6 : 0.35;
    const pluck = later(voice, step * LETTER_STEP_S);

    tone(pluck, { type: "triangle", from: note }, { peak: 0.14, attack: 0.004, release });
    tone(pluck, { type: "sine", from: note * 2 }, { peak: 0.05, attack: 0.004, release });
  }

  const end = later(voice, (OR_NOTES.length - 1) * LETTER_STEP_S);

  tone(end, { type: "sine", from: 2637.02 }, { peak: 0.05, attack: 0.01, release: 1.4 });
  noiseBurst(end, filterOf(end, "highpass", 6500), { peak: 0.12, attack: 0.05, release: 0.9 });

  for (const [delay, note] of GLITTER_TINKLES) {
    tone(
      later(end, delay),
      { type: "sine", from: note },
      { peak: 0.04, attack: 0.002, release: 0.3 },
    );
  }
};

// When the line of light flashes after the gold starts turning over (s).
const LINE_FLASH_S = 0.45;

// The Or turning over edge on and fading: air swept up in pitch, two glassy tones rising a fifth
// apart, then the zing of the line of light splitting the stage.
const platineFlip = (voice: Voice) => {
  const air = filterOf(voice, "bandpass", 500);

  air.Q.value = 1.4;
  air.frequency.exponentialRampToValueAtTime(5200, voice.at + 0.5);
  noiseBurst(voice, air, { peak: 0.36, attack: 0.4, release: 0.25 });
  tone(
    voice,
    { type: "sine", from: 329.63, to: 987.77, glide: 0.5 },
    { peak: 0.12, attack: 0.35, release: 0.35 },
  );
  tone(
    voice,
    { type: "triangle", from: 493.88, to: 1479.98, glide: 0.5 },
    { peak: 0.06, attack: 0.35, release: 0.35 },
  );

  const line = later(voice, LINE_FLASH_S);

  tone(
    line,
    { type: "sine", from: 1760, to: 3520, glide: 0.18 },
    { peak: 0.08, attack: 0.01, release: 0.45 },
  );
  noiseBurst(line, filterOf(line, "highpass", 7000), { peak: 0.1, attack: 0.005, release: 0.4 });
};

// The partials of the platinum ringing as it is assembled, in Hz, with their envelopes: a cold E,
// its fifth, its octave and its twelfth, then high inharmonic overtones, brighter and longer than
// the gold.
const PLATINUM_RING: readonly [OscillatorType, number, Envelope][] = [
  ["triangle", 329.63, { peak: 0.22, attack: 0.004, release: 2.8 }],
  ["triangle", 493.88, { peak: 0.13, attack: 0.004, release: 2.4 }],
  ["sine", 659.25, { peak: 0.14, attack: 0.003, release: 2.2 }],
  ["sine", 987.77, { peak: 0.08, attack: 0.003, release: 1.8 }],
  ["sine", 1811, { peak: 0.06, attack: 0.002, release: 1.3 }],
  ["sine", 2953, { peak: 0.05, attack: 0.002, release: 1 }],
  ["sine", 4187, { peak: 0.03, attack: 0.002, release: 0.7 }],
];

// When each stud pops in after the impact (s), and how high it ticks (Hz): one by one, around the
// hexagon.
const STUD_TICKS: readonly [number, number][] = [
  [0.2, 2637.02],
  [0.3, 2959.96],
  [0.4, 3322.44],
  [0.5, 3520],
  [0.6, 3951.07],
  [0.7, 4434.92],
];

// The Platine assembled in a blinding white: its triangles locking together in a crack of noise
// over a deep thump shaking the screen, a long bright hiss for the flash, the platinum ringing,
// then each stud ticking in.
const platineAssemble = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 130, to: 34, glide: 0.5 },
    { peak: 1, attack: 0.004, release: 0.9 },
  );
  noiseBurst(voice, filterOf(voice, "lowpass", 5200), { peak: 0.6, attack: 0.001, release: 0.25 });
  noiseBurst(voice, filterOf(voice, "bandpass", 2400), {
    peak: 0.3,
    attack: 0.001,
    release: 0.08,
  });
  noiseBurst(voice, filterOf(voice, "highpass", 6000), { peak: 0.2, attack: 0.01, release: 0.9 });

  for (const [type, from, envelope] of PLATINUM_RING) {
    tone(voice, { type, from }, envelope);
  }

  for (const [delay, note] of STUD_TICKS) {
    tone(
      later(voice, delay),
      { type: "triangle", from: note },
      { peak: 0.05, attack: 0.002, release: 0.18 },
    );
  }
};

// The notes under the name of Platine, in Hz: an E major arpeggio climbing past two octaves, one
// per letter, each doubled an octave up, softer.
const PLATINE_NOTES = [659.25, 830.61, 987.77, 1318.51, 1661.22, 1975.53, 2637.02];

// When the motes twinkle after the name's last note (s), and how high (Hz): a few of them catching
// the light as they rise.
const MOTE_TWINKLES: readonly [number, number][] = [
  [0.15, 3322.44],
  [0.32, 3951.07],
  [0.5, 2959.96],
  [0.7, 4434.92],
  [0.92, 3520],
  [1.15, 3951.07],
];

// The name of Platine: a quick rising arpeggio of plucks with their octaves over a cold pad of two
// slightly detuned fifths, richer than Or's, the last held with its fifth over a long shimmer,
// then the motes twinkling as they rise.
const platineName = (voice: Voice) => {
  const held = PLATINE_NOTES.length * LETTER_STEP_S + 1.4;

  tone(voice, { type: "sine", from: 329.63 }, { peak: 0.05, attack: 0.3, release: held });
  tone(voice, { type: "sine", from: 494.4 }, { peak: 0.04, attack: 0.3, release: held });

  for (const [step, note] of PLATINE_NOTES.entries()) {
    const last = step === PLATINE_NOTES.length - 1;
    const release = last ? 1.8 : 0.35;
    const pluck = later(voice, step * LETTER_STEP_S);

    tone(pluck, { type: "triangle", from: note }, { peak: 0.13, attack: 0.004, release });
    tone(pluck, { type: "sine", from: note * 2 }, { peak: 0.05, attack: 0.004, release });
  }

  const end = later(voice, (PLATINE_NOTES.length - 1) * LETTER_STEP_S);

  tone(end, { type: "sine", from: 3951.07 }, { peak: 0.04, attack: 0.01, release: 1.6 });
  noiseBurst(end, filterOf(end, "highpass", 7000), { peak: 0.12, attack: 0.05, release: 1.1 });

  for (const [delay, note] of MOTE_TWINKLES) {
    tone(
      later(end, delay),
      { type: "sine", from: note },
      { peak: 0.035, attack: 0.002, release: 0.35 },
    );
  }
};

const SYNTHS: Record<FaceOffSound, (voice: Voice) => void> = {
  whoosh,
  impact,
  beep,
  go,
  proposal,
  "tier-up-bronze-dissolve": bronzeDissolve,
  "tier-up-bronze-impact": bronzeImpact,
  "tier-up-bronze-name": bronzeName,
  "tier-up-argent-crack": argentCrack,
  "tier-up-argent-impact": argentImpact,
  "tier-up-argent-stamp": argentStamp,
  "tier-up-argent-sweep": argentSweep,
  "tier-up-argent-name": argentName,
  "tier-up-or-ascend": orAscend,
  "tier-up-or-materialize": orMaterialize,
  "tier-up-or-name": orName,
  "tier-up-platine-flip": platineFlip,
  "tier-up-platine-assemble": platineAssemble,
  "tier-up-platine-name": platineName,
};

// Plays `sound` into `destination` now, built from oscillators and noise: each node is dropped once
// it has played.
export const synthesize = (
  context: SynthContext,
  destination: SynthNode,
  faceOffSound: FaceOffSound,
) => SYNTHS[faceOffSound]({ context, destination, at: context.currentTime });

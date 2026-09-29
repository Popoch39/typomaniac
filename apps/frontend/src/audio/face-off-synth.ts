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

// White noise, drawn once per context, long enough for the longest noisy sound (the Maniac's
// heat and fire).
const NOISE_S = 3;

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
const silverCrack = (voice: Voice) => {
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
const silverStamp = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 260, to: 120, glide: 0.08 },
    { peak: 0.35, attack: 0.002, release: 0.12 },
  );
  tone(voice, { type: "triangle", from: 2093 }, { peak: 0.08, attack: 0.002, release: 0.25 });
};

// The Silver striking like a stamp: a deep thump under a crack of noise, the silver ringing.
const silverImpact = (voice: Voice) => {
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
const silverSweep = (voice: Voice) => {
  const shine = filterOf(voice, "bandpass", 3000);

  shine.Q.value = 1.2;
  shine.frequency.exponentialRampToValueAtTime(9000, voice.at + 0.8);
  noiseBurst(voice, shine, { peak: 0.12, attack: 0.4, release: 0.45 });
};

// The notes under the name of Silver, in Hz: an A major arpeggio over two octaves, one note a
// letter, each doubled an octave up, softer.
const SILVER_NOTES = [440, 554.37, 659.25, 880, 1108.73, 1318.51];

// The name of Silver, letter by letter: brighter plucks than Bronze's, each with its octave, the
// last held with its fifth, then a long shimmer.
const silverName = (voice: Voice) => {
  for (const [step, note] of SILVER_NOTES.entries()) {
    const last = step === SILVER_NOTES.length - 1;
    const release = last ? 1.2 : 0.3;
    const pluck = later(voice, step * LETTER_STEP_S);

    tone(pluck, { type: "triangle", from: note }, { peak: 0.15, attack: 0.004, release });
    tone(pluck, { type: "sine", from: note * 2 }, { peak: 0.05, attack: 0.004, release });
  }

  const end = later(voice, (SILVER_NOTES.length - 1) * LETTER_STEP_S);

  tone(end, { type: "sine", from: 1975.53 }, { peak: 0.06, attack: 0.01, release: 1.1 });
  noiseBurst(end, filterOf(end, "highpass", 6000), { peak: 0.12, attack: 0.05, release: 0.8 });
};

// The silver rising into the column of light, for a second: airy noise brightening as it climbs,
// over two voices rising a fifth apart, as a choir swelling.
const goldAscend = (voice: Voice) => {
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

// The Gold materializing in a blinding white: a deep thump shaking the screen, a burst of bright
// noise for the flash, then the gold ringing.
const goldMaterialize = (voice: Voice) => {
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

// The notes under the name of Gold, in Hz: a D major arpeggio over two octaves, each doubled an
// octave up, softer.
const GOLD_NOTES = [587.33, 739.99, 880, 1174.66, 1479.98, 1760];

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

// The name of Gold: a quick rising arpeggio of plucks with their octaves, richer than Silver's,
// the last held with its fifth over a long shimmer, then the glitter tinkling as it falls.
const goldName = (voice: Voice) => {
  for (const [step, note] of GOLD_NOTES.entries()) {
    const last = step === GOLD_NOTES.length - 1;
    const release = last ? 1.6 : 0.35;
    const pluck = later(voice, step * LETTER_STEP_S);

    tone(pluck, { type: "triangle", from: note }, { peak: 0.14, attack: 0.004, release });
    tone(pluck, { type: "sine", from: note * 2 }, { peak: 0.05, attack: 0.004, release });
  }

  const end = later(voice, (GOLD_NOTES.length - 1) * LETTER_STEP_S);

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

// The Gold turning over edge on and fading: air swept up in pitch, two glassy tones rising a fifth
// apart, then the zing of the line of light splitting the stage.
const platinumFlip = (voice: Voice) => {
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

// The Platinum assembled in a blinding white: its triangles locking together in a crack of noise
// over a deep thump shaking the screen, a long bright hiss for the flash, the platinum ringing,
// then each stud ticking in.
const platinumAssemble = (voice: Voice) => {
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

// The notes under the name of Platinum, in Hz: an E major arpeggio climbing past two octaves, each
// doubled an octave up, softer.
const PLATINUM_NOTES = [659.25, 830.61, 987.77, 1318.51, 1661.22, 1975.53, 2637.02];

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

// The name of Platinum: a quick rising arpeggio of plucks with their octaves over a cold pad of two
// slightly detuned fifths, richer than Gold's, the last held with its fifth over a long shimmer,
// then the motes twinkling as they rise.
const platinumName = (voice: Voice) => {
  const held = PLATINUM_NOTES.length * LETTER_STEP_S + 1.4;

  tone(voice, { type: "sine", from: 329.63 }, { peak: 0.05, attack: 0.3, release: held });
  tone(voice, { type: "sine", from: 494.4 }, { peak: 0.04, attack: 0.3, release: held });

  for (const [step, note] of PLATINUM_NOTES.entries()) {
    const last = step === PLATINUM_NOTES.length - 1;
    const release = last ? 1.8 : 0.35;
    const pluck = later(voice, step * LETTER_STEP_S);

    tone(pluck, { type: "triangle", from: note }, { peak: 0.13, attack: 0.004, release });
    tone(pluck, { type: "sine", from: note * 2 }, { peak: 0.05, attack: 0.004, release });
  }

  const end = later(voice, (PLATINUM_NOTES.length - 1) * LETTER_STEP_S);

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

// When the Platinum is gone after it starts imploding, and when the heart of light appears (s).
const IMPLODED_S = 0.7;

const CORE_S = 0.55;

// The Platinum imploding: noise sucked down in pitch as it turns into itself, a glassy tone falling
// with its fifth, a hollow pop as it is gone, then the heart of light humming, rising an octave
// with its fifth as it grows, up to the impact.
const diamondImplode = (voice: Voice) => {
  const suck = filterOf(voice, "bandpass", 6000);

  suck.Q.value = 1.6;
  suck.frequency.exponentialRampToValueAtTime(400, voice.at + IMPLODED_S);
  noiseBurst(voice, suck, { peak: 0.4, attack: 0.55, release: 0.2 });
  tone(
    voice,
    { type: "sine", from: 1975.53, to: 246.94, glide: IMPLODED_S },
    { peak: 0.1, attack: 0.5, release: 0.25 },
  );
  tone(
    voice,
    { type: "triangle", from: 2959.96, to: 369.99, glide: IMPLODED_S },
    { peak: 0.05, attack: 0.5, release: 0.25 },
  );

  const gone = later(voice, IMPLODED_S);

  tone(
    gone,
    { type: "sine", from: 220, to: 60, glide: 0.15 },
    { peak: 0.35, attack: 0.003, release: 0.2 },
  );
  snap(gone, 6000, 0.2);

  const core = later(voice, CORE_S);

  tone(
    core,
    { type: "sine", from: 123.47, to: 246.94, glide: 2.4 },
    { peak: 0.12, attack: 2.35, release: 0.15 },
  );
  tone(
    core,
    { type: "triangle", from: 185, to: 369.99, glide: 2.4 },
    { peak: 0.06, attack: 2.35, release: 0.15 },
  );
};

// The Diamond's run, in Hz: a B major arpeggio climbing past two octaves from B5. Each facet pings
// a note of it as it settles into place, and the sparkle over the name climbs it.
const DIAMOND_RUN = [987.77, 1244.51, 1479.98, 1975.53, 2489.02, 2959.96, 3951.07, 4978.03];

// Seconds between two facets, and how long after it leaves a facet has nearly settled.
const FACET_STEP_S = 0.08;

const FACET_SETTLED_S = 0.3;

// When the cut is traced in light after the first facet leaves (s).
const CUT_TRACED_S = 1.2;

// The Diamond's facets converging: the rush of the streaks and facets rising, each facet pinging
// as it settles into place, then a glissando shimmering up as its cut is traced in light.
const diamondConverge = (voice: Voice) => {
  const rush = filterOf(voice, "bandpass", 900);

  rush.Q.value = 1.2;
  rush.frequency.exponentialRampToValueAtTime(7500, voice.at + 0.9);
  noiseBurst(voice, rush, { peak: 0.22, attack: 0.8, release: 0.15 });

  for (const [step, note] of DIAMOND_RUN.entries()) {
    const ping = later(voice, step * FACET_STEP_S + FACET_SETTLED_S);

    tone(ping, { type: "triangle", from: note }, { peak: 0.06, attack: 0.002, release: 0.4 });
    tone(ping, { type: "sine", from: note * 2 }, { peak: 0.02, attack: 0.002, release: 0.3 });
  }

  const cut = later(voice, CUT_TRACED_S);

  tone(
    cut,
    { type: "sine", from: 1975.53, to: 3951.07, glide: 0.5 },
    { peak: 0.05, attack: 0.3, release: 0.3 },
  );
  noiseBurst(cut, filterOf(cut, "highpass", 7000), { peak: 0.08, attack: 0.45, release: 0.2 });
};

// The partials of the diamond ringing as it slams down, in Hz, with their envelopes: a clear B,
// its fifth, its octave, its twelfth and its double octave, then high inharmonic overtones,
// brighter and longer than the platinum.
const DIAMOND_RING: readonly [OscillatorType, number, Envelope][] = [
  ["triangle", 246.94, { peak: 0.22, attack: 0.004, release: 3.2 }],
  ["triangle", 369.99, { peak: 0.13, attack: 0.004, release: 2.8 }],
  ["sine", 493.88, { peak: 0.14, attack: 0.003, release: 2.6 }],
  ["sine", 739.99, { peak: 0.09, attack: 0.003, release: 2.2 }],
  ["sine", 987.77, { peak: 0.07, attack: 0.003, release: 2 }],
  ["sine", 1683, { peak: 0.06, attack: 0.002, release: 1.5 }],
  ["sine", 2766, { peak: 0.05, attack: 0.002, release: 1.2 }],
  ["sine", 4213, { peak: 0.04, attack: 0.002, release: 0.9 }],
  ["sine", 6011, { peak: 0.03, attack: 0.002, release: 0.6 }],
];

// When each wider ring flies out after the impact (s).
const RING_WHOOMS = [0.15, 0.32];

// When each shard of glass cracks off after the impact (s), and how bright (Hz).
const SHARD_SNAPS: readonly [number, number][] = [
  [0.01, 7800],
  [0.03, 5200],
  [0.06, 9000],
  [0.08, 6400],
  [0.11, 4600],
  [0.15, 8200],
  [0.19, 5800],
  [0.24, 7000],
  [0.3, 9400],
  [0.37, 6600],
];

// The Diamond slamming down in a blinding white: the deepest thump yet shaking the screen, a crack
// and a snap of noise, a long bright hiss for the white, the diamond ringing, the wider rings
// whooming out, and the glass shattering all around.
const diamondSlam = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 100, to: 26, glide: 0.6 },
    { peak: 1, attack: 0.003, release: 1.1 },
  );
  noiseBurst(voice, filterOf(voice, "lowpass", 6500), { peak: 0.7, attack: 0.001, release: 0.28 });
  noiseBurst(voice, filterOf(voice, "bandpass", 3000), {
    peak: 0.35,
    attack: 0.001,
    release: 0.06,
  });
  noiseBurst(voice, filterOf(voice, "highpass", 7000), { peak: 0.24, attack: 0.01, release: 0.95 });

  for (const [type, from, envelope] of DIAMOND_RING) {
    tone(voice, { type, from }, envelope);
  }

  for (const delay of RING_WHOOMS) {
    tone(
      later(voice, delay),
      { type: "sine", from: 180, to: 90, glide: 0.3 },
      { peak: 0.18, attack: 0.01, release: 0.4 },
    );
  }

  for (const [delay, frequency] of SHARD_SNAPS) {
    snap(later(voice, delay), frequency, 0.12);
  }
};

// The chord struck as the name slams down, in Hz: B major, each doubled an octave up, softer.
const DIAMOND_CHORD = [493.88, 622.25, 739.99, 987.77];

// The sparkle climbing the run over it: one note every 35 ms.
const SPARKLE_STEP_S = 0.035;

// When the glint pops in on the gem after the name (s).
const GLINT_S = 0.45;

// When the stars twinkle after the name (s), and how high (Hz).
const STAR_TWINKLES: readonly [number, number][] = [
  [0.6, 4434.92],
  [0.9, 3729.31],
  [1.25, 4978.03],
  [1.6, 3322.44],
  [2, 4186.01],
  [2.4, 3951.07],
];

// The name of Diamond, slammed down whole: a B major chord struck with its octaves over a pad of
// two slightly detuned voices and its fifth, a sparkle climbing four octaves, the last held over a
// long shimmer, richer than Platinum's; then the glint popping in on the gem, and the stars
// twinkling around it.
const diamondName = (voice: Voice) => {
  for (const note of DIAMOND_CHORD) {
    tone(voice, { type: "triangle", from: note }, { peak: 0.1, attack: 0.004, release: 1.8 });
    tone(voice, { type: "sine", from: note * 2 }, { peak: 0.04, attack: 0.004, release: 1.4 });
  }

  for (const from of [246.94, 247.9, 370.5]) {
    tone(voice, { type: "sine", from }, { peak: 0.045, attack: 0.25, release: 2.5 });
  }

  for (const [step, note] of DIAMOND_RUN.entries()) {
    const last = step === DIAMOND_RUN.length - 1;

    tone(
      later(voice, step * SPARKLE_STEP_S),
      { type: "triangle", from: note },
      { peak: 0.06, attack: 0.003, release: last ? 1.6 : 0.3 },
    );
  }

  const end = later(voice, (DIAMOND_RUN.length - 1) * SPARKLE_STEP_S);

  noiseBurst(end, filterOf(end, "highpass", 7500), { peak: 0.1, attack: 0.05, release: 0.9 });

  const glint = later(voice, GLINT_S);

  tone(glint, { type: "sine", from: 3951.07 }, { peak: 0.06, attack: 0.002, release: 0.5 });
  noiseBurst(glint, filterOf(glint, "highpass", 8000), { peak: 0.08, attack: 0.005, release: 0.3 });

  for (const [delay, note] of STAR_TWINKLES) {
    tone(
      later(voice, delay),
      { type: "sine", from: note },
      { peak: 0.035, attack: 0.002, release: 0.4 },
    );
  }
};

// How long the heat rises before the gem breaks (s).
const HEAT_S = 1.6;

// The gem crackling as it heats and trembles, closer and closer (s after the heat starts, Hz).
const HEAT_CRACKLES: readonly [number, number][] = [
  [0.35, 2400],
  [0.6, 3100],
  [0.8, 2000],
  [0.95, 3600],
  [1.05, 2700],
  [1.15, 4200],
  [1.22, 2300],
  [1.3, 3800],
  [1.36, 3000],
  [1.42, 4600],
  [1.47, 2600],
  [1.52, 5000],
];

// When each crack of white heat runs through the gem after the heat starts (s).
const HEAT_CRACKS = [0.7, 0.95, 1.1];

// The heat rising under the Diamond: a deep rumble swelling and brightening, a sub-bass rising a
// fifth under a growl, the gem crackling closer and closer as it trembles, and a hiss for each
// crack of white heat running through it.
const maniacHeat = (voice: Voice) => {
  const rumble = filterOf(voice, "lowpass", 90);

  rumble.frequency.exponentialRampToValueAtTime(700, voice.at + HEAT_S);
  noiseBurst(voice, rumble, { peak: 0.55, attack: HEAT_S - 0.05, release: 0.2 });
  tone(
    voice,
    { type: "sine", from: 36.71, to: 55, glide: HEAT_S },
    { peak: 0.32, attack: HEAT_S - 0.1, release: 0.3 },
  );
  tone(
    voice,
    { type: "sawtooth", from: 73.42, to: 110, glide: HEAT_S },
    { peak: 0.04, attack: HEAT_S - 0.1, release: 0.2 },
  );

  for (const [delay, frequency] of HEAT_CRACKLES) {
    snap(later(voice, delay), frequency, 0.05 + delay * 0.05);
  }

  for (const delay of HEAT_CRACKS) {
    const crack = later(voice, delay);

    noiseBurst(crack, filterOf(crack, "highpass", 5000), {
      peak: 0.12,
      attack: 0.25,
      release: 0.1,
    });
  }
};

// When the heart of the vortex beats after the gem breaks, two beats at a time (s).
const HEARTBEATS = [0.3, 0.45, 0.85, 1];

// The gem breaking into the vortex: a shatter of snaps, the embers whirling in (noise swept up and
// down, twice, around the heart), a tone sucked up as the heart grows, and the heart beating.
const maniacVortex = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 160, to: 50, glide: 0.25 },
    { peak: 0.6, attack: 0.003, release: 0.35 },
  );

  for (const [delay, frequency] of SHARD_SNAPS.slice(0, 6)) {
    snap(later(voice, delay), frequency, 0.14);
  }

  for (const [delay, from, to] of [
    [0.1, 400, 3200],
    [0.6, 3200, 500],
  ] as const) {
    const swirl = later(voice, delay);
    const filter = filterOf(swirl, "bandpass", from);

    filter.Q.value = 2.4;
    filter.frequency.exponentialRampToValueAtTime(to, swirl.at + 0.55);
    noiseBurst(swirl, filter, { peak: 0.3, attack: 0.3, release: 0.3 });
  }

  const heart = later(voice, 0.1);

  tone(
    heart,
    { type: "sine", from: 110, to: 440, glide: 1.4 },
    { peak: 0.08, attack: 1.3, release: 0.15 },
  );
  tone(
    heart,
    { type: "triangle", from: 164.81, to: 659.25, glide: 1.4 },
    { peak: 0.04, attack: 1.3, release: 0.15 },
  );

  for (const [beat, delay] of HEARTBEATS.entries()) {
    tone(
      later(voice, delay),
      { type: "sine", from: 70, to: 40, glide: 0.12 },
      { peak: beat % 2 === 0 ? 0.45 : 0.3, attack: 0.004, release: 0.18 },
    );
  }
};

// When the crown starts to drop after the silence starts (s).
const DROP_S = 0.45;

// The silence: every sound sucked out in a breath held, a faint high drone fading to nothing,
// then the crown whistling down from above, louder and lower as it falls.
const maniacHush = (voice: Voice) => {
  const breath = filterOf(voice, "bandpass", 5000);

  breath.Q.value = 3;
  breath.frequency.exponentialRampToValueAtTime(1200, voice.at + 0.4);
  noiseBurst(voice, breath, { peak: 0.1, attack: 0.05, release: 0.4 });
  tone(voice, { type: "sine", from: 1760 }, { peak: 0.012, attack: 0.1, release: 0.35 });

  const fall = later(voice, DROP_S);

  tone(
    fall,
    { type: "sine", from: 1400, to: 180, glide: 0.6 },
    { peak: 0.08, attack: 0.55, release: 0.05 },
  );

  const rush = filterOf(fall, "bandpass", 3500);

  rush.Q.value = 1.2;
  rush.frequency.exponentialRampToValueAtTime(300, fall.at + 0.6);
  noiseBurst(fall, rush, { peak: 0.35, attack: 0.57, release: 0.03 });
};

// The partials of the crown ringing as it lands, in Hz, with their envelopes: a deep D, its fifth,
// its octave and its tenth, then inharmonic overtones, the longest and deepest ring of all.
const CROWN_RING: readonly [OscillatorType, number, Envelope][] = [
  ["triangle", 146.83, { peak: 0.24, attack: 0.004, release: 3.6 }],
  ["triangle", 220, { peak: 0.14, attack: 0.004, release: 3.2 }],
  ["sine", 293.66, { peak: 0.14, attack: 0.003, release: 3 }],
  ["sine", 369.99, { peak: 0.08, attack: 0.003, release: 2.6 }],
  ["sine", 587.33, { peak: 0.07, attack: 0.003, release: 2.2 }],
  ["sine", 1021, { peak: 0.05, attack: 0.002, release: 1.6 }],
  ["sine", 1763, { peak: 0.04, attack: 0.002, release: 1.2 }],
  ["sine", 2894, { peak: 0.03, attack: 0.002, release: 0.8 }],
];

// When each ring of the quake flies out after the landing (s): three.
const QUAKE_WHOOMS = [0, 0.1, 0.25];

// When each gem of the crown lights after the landing (s), how high it rings (Hz), and when the
// flame catches.
const GEM_LIGHTS: readonly [number, number][] = [
  [0.35, 1174.66],
  [0.55, 1396.91],
  [0.75, 1760],
  [0.95, 2349.32],
];

const FLAME_S = 1.15;

// The crown landing after the silence with a quake: the deepest thump of all shaking the ground,
// a long rumble under it, a crack, the crown ringing, its three rings whooming out; then each gem
// lighting with a bright ring, and the flame catching with a soft roar.
const maniacQuake = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 90, to: 20, glide: 0.8 },
    { peak: 1, attack: 0.003, release: 1.4 },
  );
  noiseBurst(voice, filterOf(voice, "lowpass", 260), { peak: 0.8, attack: 0.005, release: 1.2 });
  noiseBurst(voice, filterOf(voice, "lowpass", 5000), { peak: 0.6, attack: 0.001, release: 0.3 });
  snap(voice, 2600, 0.4);

  for (const [type, from, envelope] of CROWN_RING) {
    tone(voice, { type, from }, envelope);
  }

  for (const delay of QUAKE_WHOOMS) {
    tone(
      later(voice, delay),
      { type: "sine", from: 160, to: 60, glide: 0.4 },
      { peak: 0.2, attack: 0.01, release: 0.5 },
    );
  }

  for (const [delay, note] of GEM_LIGHTS) {
    const gem = later(voice, delay);

    tone(gem, { type: "triangle", from: note }, { peak: 0.07, attack: 0.002, release: 0.5 });
    tone(gem, { type: "sine", from: note * 2 }, { peak: 0.025, attack: 0.002, release: 0.35 });
  }

  const flame = later(voice, FLAME_S);
  const roar = filterOf(flame, "bandpass", 300);

  roar.Q.value = 0.8;
  roar.frequency.exponentialRampToValueAtTime(1800, flame.at + 0.4);
  noiseBurst(flame, roar, { peak: 0.3, attack: 0.15, release: 0.6 });
};

// The embers crackling as the fire spreads, over two seconds (s after it catches, Hz).
const FIRE_CRACKLES: readonly [number, number][] = [
  [0.05, 3200],
  [0.12, 4800],
  [0.2, 2600],
  [0.31, 5600],
  [0.4, 3900],
  [0.52, 2900],
  [0.61, 5200],
  [0.75, 3400],
  [0.9, 4400],
  [1.04, 2800],
  [1.2, 5000],
  [1.38, 3600],
  [1.55, 4600],
  [1.75, 3000],
  [1.95, 5400],
];

// The crown catching fire: a heartbeat of a thump as it swells, a great roar of fire blown out
// and dying away over the gusts, a low drone of the fire's D and its fifth, and the embers
// crackling all around as the fire spreads.
const maniacIgnite = (voice: Voice) => {
  tone(
    voice,
    { type: "sine", from: 110, to: 32, glide: 0.5 },
    { peak: 0.9, attack: 0.004, release: 0.8 },
  );

  const roar = filterOf(voice, "bandpass", 200);

  roar.Q.value = 0.7;
  roar.frequency.exponentialRampToValueAtTime(2400, voice.at + 0.25);
  noiseBurst(voice, roar, { peak: 0.7, attack: 0.12, release: 1.8 });
  noiseBurst(voice, filterOf(voice, "lowpass", 400), { peak: 0.5, attack: 0.05, release: 2.2 });

  for (const from of [73.42, 110, 146.83]) {
    tone(voice, { type: "sawtooth", from }, { peak: 0.03, attack: 0.3, release: 2.4 });
  }

  for (const [delay, frequency] of FIRE_CRACKLES) {
    snap(later(voice, delay), frequency, 0.1);
  }
};

// The notes the letters of Maniac slam down on, in Hz: a D minor arpeggio climbing two octaves,
// one letter every 0.1 s.
const MANIAC_NOTES = [293.66, 349.23, 440, 587.33, 698.46, 880];

const MANIAC_LETTER_S = 0.1;

// The chord the name ends on, in Hz: D, its fifth and its octave, the fire's power chord.
const MANIAC_CHORD = [146.83, 220, 293.66, 440, 587.33];

// The name of Maniac, letter by letter: each letter slammed down with a thud and a note of a D
// minor arpeggio climbing two octaves; then, on the last, a power chord struck over a pad of three
// detuned voices, a shimmer rising over it and the fire crackling on, the richest of all.
const maniacName = (voice: Voice) => {
  for (const [step, note] of MANIAC_NOTES.entries()) {
    const letter = later(voice, step * MANIAC_LETTER_S);

    tone(
      letter,
      { type: "sine", from: 120, to: 50, glide: 0.1 },
      { peak: 0.35, attack: 0.003, release: 0.14 },
    );
    tone(letter, { type: "triangle", from: note }, { peak: 0.09, attack: 0.004, release: 0.4 });
    snap(letter, 3500, 0.06);
  }

  const end = later(voice, (MANIAC_NOTES.length - 1) * MANIAC_LETTER_S);

  for (const note of MANIAC_CHORD) {
    tone(end, { type: "sawtooth", from: note }, { peak: 0.035, attack: 0.01, release: 2.4 });
    tone(end, { type: "triangle", from: note * 2 }, { peak: 0.05, attack: 0.005, release: 2 });
  }

  for (const from of [146.83, 147.6, 220.8]) {
    tone(end, { type: "sine", from }, { peak: 0.05, attack: 0.3, release: 2.8 });
  }

  tone(
    end,
    { type: "sine", from: 1760, to: 3520, glide: 0.8 },
    { peak: 0.04, attack: 0.5, release: 0.6 },
  );
  noiseBurst(end, filterOf(end, "highpass", 7000), { peak: 0.09, attack: 0.1, release: 1.2 });

  for (const [delay, frequency] of FIRE_CRACKLES.slice(0, 8)) {
    snap(later(end, 0.3 + delay), frequency, 0.05);
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
  "tier-up-silver-crack": silverCrack,
  "tier-up-silver-impact": silverImpact,
  "tier-up-silver-stamp": silverStamp,
  "tier-up-silver-sweep": silverSweep,
  "tier-up-silver-name": silverName,
  "tier-up-gold-ascend": goldAscend,
  "tier-up-gold-materialize": goldMaterialize,
  "tier-up-gold-name": goldName,
  "tier-up-platinum-flip": platinumFlip,
  "tier-up-platinum-assemble": platinumAssemble,
  "tier-up-platinum-name": platinumName,
  "tier-up-diamond-implode": diamondImplode,
  "tier-up-diamond-converge": diamondConverge,
  "tier-up-diamond-slam": diamondSlam,
  "tier-up-diamond-name": diamondName,
  "tier-up-maniac-heat": maniacHeat,
  "tier-up-maniac-vortex": maniacVortex,
  "tier-up-maniac-hush": maniacHush,
  "tier-up-maniac-quake": maniacQuake,
  "tier-up-maniac-ignite": maniacIgnite,
  "tier-up-maniac-name": maniacName,
};

// Plays `sound` into `destination` now, built from oscillators and noise: each node is dropped once
// it has played.
export const synthesize = (
  context: SynthContext,
  destination: SynthNode,
  faceOffSound: FaceOffSound,
) => SYNTHS[faceOffSound]({ context, destination, at: context.currentTime });

import type { FaceOffSound } from "@/audio/face-off-sounds";

// The quietest level of an envelope: an exponential ramp never reaches 0.
const SILENT = 0.0001;

// White noise, drawn once per context, long enough for the longest noisy sound.
const NOISE_S = 0.5;

const noises = new WeakMap<BaseAudioContext, AudioBuffer>();

const noiseOf = (context: BaseAudioContext) => {
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

// A gain that rises to `peak` in `attack` seconds from `at`, then dies away in `release`.
const envelope = (
  context: BaseAudioContext,
  at: number,
  peak: number,
  attack: number,
  release: number,
) => {
  const gain = context.createGain();

  gain.gain.setValueAtTime(SILENT, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(SILENT, at + attack + release);

  return gain;
};

// Noise for `seconds` from `at`, through `filter`, into `level`.
const noiseBurst = (
  context: BaseAudioContext,
  filter: BiquadFilterNode,
  level: GainNode,
  destination: AudioNode,
  at: number,
  seconds: number,
) => {
  const source = context.createBufferSource();

  source.buffer = noiseOf(context);
  source.connect(filter).connect(level).connect(destination);
  source.start(at);
  source.stop(at + seconds);
};

// A tone of `type` from `at`, gliding from `from` to `to` Hz over `glide` seconds, into `level`.
const tone = (
  context: BaseAudioContext,
  type: OscillatorType,
  { from, to = from, glide = 0 }: { from: number; to?: number; glide?: number },
  level: GainNode,
  destination: AudioNode,
  at: number,
  seconds: number,
) => {
  const oscillator = context.createOscillator();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, at);

  if (glide > 0) {
    oscillator.frequency.exponentialRampToValueAtTime(to, at + glide);
  }

  oscillator.connect(level).connect(destination);
  oscillator.start(at);
  oscillator.stop(at + seconds);
};

// The panels coming in: noise rising in pitch and level up to their impact, 0.35 s later.
const whoosh = (context: BaseAudioContext, destination: AudioNode, at: number) => {
  const filter = context.createBiquadFilter();

  filter.type = "bandpass";
  filter.Q.value = 1.4;
  filter.frequency.setValueAtTime(300, at);
  filter.frequency.exponentialRampToValueAtTime(2600, at + 0.35);
  noiseBurst(context, filter, envelope(context, at, 0.9, 0.32, 0.08), destination, at, 0.42);
};

// The panels meeting: a low thump falling in pitch, under a short crack of muffled noise.
const impact = (context: BaseAudioContext, destination: AudioNode, at: number) => {
  const filter = context.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.value = 1400;
  tone(
    context,
    "sine",
    { from: 150, to: 42, glide: 0.3 },
    envelope(context, at, 1, 0.005, 0.5),
    destination,
    at,
    0.52,
  );
  noiseBurst(context, filter, envelope(context, at, 0.7, 0.002, 0.16), destination, at, 0.2);
};

// A digit of the 3-2-1: a short, bright beep.
const beep = (context: BaseAudioContext, destination: AudioNode, at: number) =>
  tone(
    context,
    "square",
    { from: 660 },
    envelope(context, at, 0.22, 0.004, 0.14),
    destination,
    at,
    0.16,
  );

// GO: an octave above the beeps, with its fifth, held longer.
const go = (context: BaseAudioContext, destination: AudioNode, at: number) => {
  tone(
    context,
    "square",
    { from: 1320 },
    envelope(context, at, 0.2, 0.004, 0.45),
    destination,
    at,
    0.48,
  );
  tone(
    context,
    "triangle",
    { from: 1980 },
    envelope(context, at, 0.25, 0.004, 0.4),
    destination,
    at,
    0.44,
  );
};

const SYNTHS = { whoosh, impact, beep, go };

// Plays `sound` into `destination` now, built from oscillators and noise: each node is dropped once
// it has played.
export const synthesize = (
  context: BaseAudioContext,
  destination: AudioNode,
  sound: FaceOffSound,
) => SYNTHS[sound](context, destination, context.currentTime);

import type { FaceOffSound } from "@/audio/face-off-sounds";

// Where and when a sound plays: every node of it is built on `context`, starts at `at` and ends in
// `destination`.
type Voice = { context: BaseAudioContext; destination: AudioNode; at: number };

// A level rising to `peak` in `attack` seconds, then dying away in `release`.
type Envelope = { peak: number; attack: number; release: number };

// The quietest level of an envelope: an exponential ramp never reaches 0.
const SILENT = 0.0001;

// A source stops this long after its envelope has died away.
const TAIL_S = 0.02;

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

// Plays `source` through `through`, then a gain shaped by `envelope`, into the voice's
// destination: stopped once the envelope has died away.
const sound = (
  { context, destination, at }: Voice,
  source: AudioScheduledSourceNode,
  through: AudioNode,
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

// Noise through `filter`.
const noiseBurst = (voice: Voice, filter: BiquadFilterNode, envelope: Envelope) => {
  const source = voice.context.createBufferSource();

  source.buffer = noiseOf(voice.context);
  source.connect(filter);
  sound(voice, source, filter, envelope);
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
  const filter = voice.context.createBiquadFilter();

  filter.type = "bandpass";
  filter.Q.value = 1.4;
  filter.frequency.setValueAtTime(300, voice.at);
  filter.frequency.exponentialRampToValueAtTime(2600, voice.at + 0.35);
  noiseBurst(voice, filter, { peak: 0.9, attack: 0.32, release: 0.08 });
};

// The panels meeting: a low thump falling in pitch, under a short crack of muffled noise.
const impact = (voice: Voice) => {
  const filter = voice.context.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.value = 1400;
  tone(
    voice,
    { type: "sine", from: 150, to: 42, glide: 0.3 },
    { peak: 1, attack: 0.005, release: 0.5 },
  );
  noiseBurst(voice, filter, { peak: 0.7, attack: 0.002, release: 0.16 });
};

// A digit of the 3-2-1: a short, bright beep.
const beep = (voice: Voice) =>
  tone(voice, { type: "square", from: 660 }, { peak: 0.22, attack: 0.004, release: 0.14 });

// GO: an octave above the beeps, with its fifth, held longer.
const go = (voice: Voice) => {
  tone(voice, { type: "square", from: 1320 }, { peak: 0.2, attack: 0.004, release: 0.45 });
  tone(voice, { type: "triangle", from: 1980 }, { peak: 0.25, attack: 0.004, release: 0.4 });
};

const SYNTHS = { whoosh, impact, beep, go };

// Plays `sound` into `destination` now, built from oscillators and noise: each node is dropped once
// it has played.
export const synthesize = (
  context: BaseAudioContext,
  destination: AudioNode,
  faceOffSound: FaceOffSound,
) => SYNTHS[faceOffSound]({ context, destination, at: context.currentTime });

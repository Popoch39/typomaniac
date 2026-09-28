// PROTOTYPE, throwaway: the keystroke waves of the Maniac's Aura, tunable. Once the values are
// chosen, they move into `aura-timing.ts` and the real shader, and this folder goes.

export type CadenceName = "sober" | "typist" | "frantic";

// One loop of hits, in seconds: a typist's bursts and their pauses.
type Cadence = { period: number; hits: readonly number[] };

export const CADENCES: Record<CadenceName, Cadence> = {
  sober: { period: 3.6, hits: [0, 0.2, 0.4] },
  typist: {
    period: 4.2,
    hits: [0, 0.13, 0.25, 0.4, 1.55, 1.68, 1.8, 2.75, 2.86, 2.98, 3.1, 3.24],
  },
  frantic: {
    period: 3,
    hits: [0, 0.09, 0.18, 0.27, 0.36, 0.45, 1.1, 1.19, 1.28, 1.37, 1.9, 1.99, 2.08, 2.17, 2.26],
  },
};

export const CADENCE_NAMES: readonly CadenceName[] = ["sober", "typist", "frantic"];

export type KeystrokeParams = {
  cadence: CadenceName;
  // Full Aura: how long a wave lives, where it is born and where it ends (0 the centre, 1 the
  // canvas's edge), how much it slows down as it spreads, its thickness, the light it leaves
  // behind, the halo at rest, how much each hit lights it up and how fast that fades.
  life: number;
  birth: number;
  reach: number;
  curve: number;
  thickness: number;
  trail: number;
  halo: number;
  flash: number;
  flashDecay: number;
  // Light Aura: how long a ring lives, how far it grows, how thick its stroke.
  lightLife: number;
  lightScale: number;
  lightWidth: number;
};

export const PRESETS: Record<CadenceName, KeystrokeParams> = {
  sober: {
    cadence: "sober",
    life: 1.8,
    birth: 0.42,
    reach: 0.95,
    curve: 2.2,
    thickness: 0.014,
    trail: 0.08,
    halo: 0.3,
    flash: 0.35,
    flashDecay: 0.3,
    lightLife: 1.1,
    lightScale: 1.4,
    lightWidth: 1,
  },
  typist: {
    cadence: "typist",
    life: 1.5,
    birth: 0.42,
    reach: 0.97,
    curve: 2,
    thickness: 0.018,
    trail: 0.15,
    halo: 0.35,
    flash: 0.6,
    flashDecay: 0.22,
    lightLife: 0.9,
    lightScale: 1.45,
    lightWidth: 1.2,
  },
  frantic: {
    cadence: "frantic",
    life: 1.2,
    birth: 0.42,
    reach: 0.97,
    curve: 1.6,
    thickness: 0.02,
    trail: 0.2,
    halo: 0.45,
    flash: 0.8,
    flashDecay: 0.15,
    lightLife: 0.7,
    lightScale: 1.5,
    lightWidth: 1.4,
  },
};

// At most this many waves drawn at once: the youngest.
export const MAX_WAVES = 6;

const modulo = (value: number, by: number) => ((value % by) + by) % by;

// The waves in flight at `time`: each one's age from 0 (born) to 1 (gone), -1 for an empty slot,
// and how lit the halo is by the latest hits.
export const wavesAt = (time: number, params: KeystrokeParams) => {
  const { period, hits } = CADENCES[params.cadence];
  const ages: number[] = [];
  let flash = 0;

  for (const hit of hits) {
    const since = modulo(time - hit, period);

    if (since < params.life) {
      ages.push(since / params.life);
    }

    flash = Math.max(flash, Math.exp(-since / params.flashDecay));
  }

  const youngest = ages.toSorted((a, b) => a - b).slice(0, MAX_WAVES);

  while (youngest.length < MAX_WAVES) {
    youngest.push(-1);
  }

  return { ages: youngest, flash };
};

// A time of the loop caught mid-burst: the most waves in flight (three at most counted) all
// clear of the metal yet not faded. The still image of reduced motion.
export const frozenTime = (params: KeystrokeParams) => {
  const { period } = CADENCES[params.cadence];
  let best = { time: period * 0.3, shown: 0 };

  for (let time = 0; time < period; time += 0.01) {
    const shown = wavesAt(time, params).ages.filter((age) => age >= 0.3 && age <= 0.75).length;

    if (shown > best.shown) {
      best = { time, shown };
    }

    if (shown >= 3) {
      return time;
    }
  }

  return best.time;
};

// The timing of the light Aura, in seconds.

// How long the sheen takes to sweep the Ornament, then how long it rests before the next sweep.
export const SHEEN_SWEEP = 1.1;

export const SHEEN_REST = 5;

export const SHEEN_PERIOD = SHEEN_SWEEP + SHEEN_REST;

// How long a spark takes to light up, how long it rests unlit between two twinkles, and how far
// apart the sparks of one Ornament start.
export const SPARK_TWINKLE = 0.45;

export const SPARK_REST = 2.4;

export const SPARK_STAGGER = 0.9;

// One twinkle, lit then unlit, and its rest.
export const SPARK_PERIOD = SPARK_TWINKLE * 2 + SPARK_REST;

// The golden ratio's fraction: multiples of it fall evenly over [0, 1), whatever the hash.
const GOLDEN = 0.618_033_988_749_895;

// FNV-1a, 32 bits: neighbouring ids, one character apart, land far apart.
const hash = (text: string) => {
  let value = 0x81_1c_9d_c5;

  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01_00_01_93);
  }

  return value >>> 0;
};

// Where one instance falls in [0, 1), from its React id: always the same for that instance,
// different for its neighbours.
const phase = (instance: string) => (hash(instance) * GOLDEN) % 1;

// When one instance's sheen first sweeps: the rows of a list never shine together.
export const sheenDelay = (instance: string) => phase(instance) * SHEEN_PERIOD;

// When one instance's first spark first twinkles: the rows of a list never twinkle in step.
export const sparkDelay = (instance: string) => phase(instance) * SPARK_PERIOD;

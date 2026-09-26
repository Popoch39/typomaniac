// How long the sheen takes to sweep the Ornament, then how long it rests before the next sweep,
// in seconds.
export const SHEEN_SWEEP = 1.1;

export const SHEEN_REST = 5;

export const SHEEN_PERIOD = SHEEN_SWEEP + SHEEN_REST;

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

// When one instance's sheen first sweeps, from its React id: always the same for that instance,
// different for its neighbours, so the rows of a list never shine together.
export const sheenDelay = (instance: string) => ((hash(instance) * GOLDEN) % 1) * SHEEN_PERIOD;

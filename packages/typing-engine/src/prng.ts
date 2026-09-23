// mulberry32: a 32-bit PRNG, tiny and fast, whose sequence is fully fixed by its seed.
export const mulberry32 = (seed: number) => {
  let state = seed >>> 0;

  // Returns a float in [0, 1), like Math.random.
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};

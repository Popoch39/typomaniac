// The laurels the Argent → Or artboard draws around the Or Emblem, on the Emblem's 32 grid.

// Their two stems, around the shield: from its foot up to its shoulders.
export const STEMS = [
  "M11.99 29.97 A15.5 15.5 0 0 1 3 6.55",
  "M20.01 29.97 A15.5 15.5 0 0 0 29 6.55",
];

// The leaves along the left stem, from its foot up: where each sits and how it is turned (deg).
// The right stem's mirror them.
const LEFT_LEAVES = [
  [11.99, 29.97, 165],
  [7.56, 28, 183],
  [3.95, 24.75, 201],
  [1.53, 20.55, 219],
  [0.52, 15.81, 237],
  [1.03, 10.99, 255],
  [3, 6.55, 273],
] as const;

// Each pair of leaves, left then right, from the foot up: the timeline pops them in pair by pair.
export const LEAVES = LEFT_LEAVES.flatMap(([x, y, turn], pair) => [
  { x, y, turn, pair },
  { x: 32 - x, y, turn: 180 - turn, pair },
]);

// How many pairs of leaves the laurels have.
export const LEAF_PAIRS = LEFT_LEAVES.length;

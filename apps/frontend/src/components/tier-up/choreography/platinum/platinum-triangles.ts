// The six triangles the Platinum is assembled from, as the Gold → Platinum artboard cuts them: from
// the centre of its 32 grid to two corners of the hexagon (a little past them, to keep its rim),
// clockwise from the top. Each flies in from far off (px), turned flat (deg) and edge on (deg),
// the first one first and slowest: all meet at the impact.
type Point = readonly [x: number, y: number];

const CENTRE: Point = [16, 16];

// A point of the 32 grid on the Emblem's box, in %.
const onBox = ([x, y]: Point) => `${(x / 32) * 100}% ${(y / 32) * 100}%`;

const triangle = (from: Point, to: Point) => `polygon(${[CENTRE, from, to].map(onBox).join(", ")})`;

const TOP: Point = [16, -2.2];

const UPPER_RIGHT: Point = [31.6, 6.9];

const LOWER_RIGHT: Point = [31.6, 25.1];

const BOTTOM: Point = [16, 34.2];

const LOWER_LEFT: Point = [0.4, 25.1];

const UPPER_LEFT: Point = [0.4, 6.9];

export const PLATINUM_TRIANGLES = [
  { clip: triangle(TOP, UPPER_RIGHT), x: 220, y: -383, rotation: 120, rotationY: 70, at: 1.5 },
  {
    clip: triangle(UPPER_RIGHT, LOWER_RIGHT),
    x: 440,
    y: 0,
    rotation: -120,
    rotationY: -70,
    at: 1.58,
  },
  { clip: triangle(LOWER_RIGHT, BOTTOM), x: 220, y: 383, rotation: 120, rotationY: 70, at: 1.66 },
  { clip: triangle(BOTTOM, LOWER_LEFT), x: -220, y: 383, rotation: -120, rotationY: -70, at: 1.74 },
  { clip: triangle(LOWER_LEFT, UPPER_LEFT), x: -440, y: 0, rotation: 120, rotationY: 70, at: 1.82 },
  { clip: triangle(UPPER_LEFT, TOP), x: -220, y: -383, rotation: -120, rotationY: -70, at: 1.9 },
] as const;

// When they all meet, whole.
export const ASSEMBLED_AT = 2.3;

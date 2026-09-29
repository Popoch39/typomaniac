import type { tierUpPaint } from "@/components/tier-up/parts/tier-up-paint";

type FacetColor = keyof ReturnType<typeof tierUpPaint>["facet"];

// A facet the Diamond's gem is cut into, as the Platinum → Diamond artboard cuts it: its corners
// on the Emblem's 32 grid, its colour, and where it flies in from: how far off (px, `z` towards the
// viewer) and turned how far about its width and its height (deg).
type Facet = {
  points: string;
  color: FacetColor;
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
};

// The eight facets, across the crown from the left, then down the pavilion.
export const DIAMOND_FACETS: readonly Facet[] = [
  {
    points: "9,4 12,12 2,12",
    color: "light",
    x: -700,
    y: -260,
    z: 300,
    rotationX: 140,
    rotationY: -120,
  },
  {
    points: "9,4 16,4 12,12",
    color: "pale",
    x: -300,
    y: -560,
    z: -200,
    rotationX: -160,
    rotationY: 90,
  },
  {
    points: "16,4 20,12 12,12",
    color: "sheen",
    x: 0,
    y: -660,
    z: 400,
    rotationX: 120,
    rotationY: 140,
  },
  {
    points: "16,4 23,4 20,12",
    color: "mid",
    x: 320,
    y: -560,
    z: -200,
    rotationX: -140,
    rotationY: -100,
  },
  {
    points: "23,4 30,12 20,12",
    color: "deep",
    x: 700,
    y: -260,
    z: 300,
    rotationX: 150,
    rotationY: 120,
  },
  {
    points: "2,12 12,12 16,30",
    color: "frost",
    x: -660,
    y: 380,
    z: 200,
    rotationX: -120,
    rotationY: 150,
  },
  {
    points: "12,12 20,12 16,30",
    color: "mid",
    x: 0,
    y: 640,
    z: -300,
    rotationX: 160,
    rotationY: -80,
  },
  {
    points: "20,12 30,12 16,30",
    color: "crease",
    x: 660,
    y: 380,
    z: 200,
    rotationX: -150,
    rotationY: -140,
  },
];

// When the first facet flies in, then seconds between a facet and the next, and how long each
// flies.
export const FACETS_AT = 2.1;

export const FACET_STEP_S = 0.08;

export const FACET_S = 0.75;

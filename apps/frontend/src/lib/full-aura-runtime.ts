import type { Tier } from "ranked";

import type { FullAuraClaim, FullAuraRequest, FullAuraRuntime } from "@/lib/aura-runtime";

// What draws one full Aura on its canvas: a frame at `time` (in seconds), at the canvas's size,
// until disposed.
export type FullAuraPainter = {
  draw: (time: number) => void;
  dispose: () => void;
};

// A loop that calls `onFrame` at every frame, with the time in seconds, until stopped.
export type FrameClock = (onFrame: (time: number) => void) => () => void;

// What the runtime needs from the browser: a painter on a canvas (null without WebGL2, or if its
// context cannot be opened), which calls `onLost` if its context is lost; the frames; the
// screen's pixel density.
export type FullAuraParts = {
  open: (canvas: HTMLCanvasElement, tier: Tier, onLost: () => void) => FullAuraPainter | null;
  frames: FrameClock;
  pixelRatio: () => number;
};

// At most this many full Auras at once, far below the browser's own limit of WebGL contexts.
export const FULL_AURA_CAPACITY = 8;

// Denser screens are drawn at this density: sharp enough for a soft light, and within budget.
export const MAX_PIXEL_RATIO = 1.5;

type Entry = {
  canvas: HTMLCanvasElement;
  painter: FullAuraPainter;
  still: boolean;
  seen: boolean;
  drawn: boolean;
};

// A full Aura is drawn while seen; a still one only once.
const due = (entry: Entry) => entry.seen && !(entry.still && entry.drawn);

// The canvas holds as many pixels as it shows, up to `MAX_PIXEL_RATIO` per CSS pixel.
const fit = (canvas: HTMLCanvasElement, ratio: number) => {
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
};

// The full Aura's runtime: `FULL_AURA_CAPACITY` canvases at most, first come first served, a place
// freed when one is released or its context lost. One frame loop for all, running only while an
// Aura is due, drawing only the Auras due.
export const openFullAuraRuntime = ({
  open,
  frames,
  pixelRatio,
}: FullAuraParts): FullAuraRuntime => {
  const entries = new Set<Entry>();
  let stopFrames: (() => void) | null = null;

  const frame = (time: number) => {
    const ratio = Math.min(pixelRatio(), MAX_PIXEL_RATIO);

    for (const entry of entries) {
      if (due(entry)) {
        fit(entry.canvas, ratio);
        entry.painter.draw(time);
        entry.drawn = true;
      }
    }

    loopWhileDue();
  };

  // The loop runs while an Aura is due, and only then.
  const loopWhileDue = () => {
    const anyDue = [...entries].some(due);

    if (anyDue && stopFrames === null) {
      stopFrames = frames(frame);
    } else if (!anyDue && stopFrames !== null) {
      stopFrames();
      stopFrames = null;
    }
  };

  const drop = (entry: Entry) => {
    if (entries.delete(entry)) {
      entry.painter.dispose();
      loopWhileDue();

      return true;
    }

    return false;
  };

  return {
    claim: ({ canvas, tier, still, onLost }: FullAuraRequest): FullAuraClaim | null => {
      if (entries.size >= FULL_AURA_CAPACITY) {
        return null;
      }

      // Set once the painter exists. A context lost after its release says nothing.
      let entry: Entry | null = null;

      const painter = open(canvas, tier, () => {
        if (entry !== null && drop(entry)) {
          onLost();
        }
      });

      if (painter === null) {
        return null;
      }

      const granted: Entry = { canvas, painter, still, seen: false, drawn: false };

      entry = granted;
      entries.add(granted);

      return {
        see: (seen) => {
          granted.seen = seen;
          loopWhileDue();
        },
        release: () => {
          drop(granted);
        },
      };
    },
  };
};

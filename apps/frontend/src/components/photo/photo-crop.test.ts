import { describe, expect, test } from "vitest";

import { cropOf, frameView, initialFraming, moved, zoomed } from "@/components/photo/photo-crop";

// A landscape photo of 1200 × 800, framed in a square of 200 px.
const photo = { width: 1200, height: 800 };

const FRAME = 200;

describe("initialFraming", () => {
  test("starts on the centre of the photo, its whole short side in the frame", () => {
    const framing = initialFraming(photo);

    expect(framing).toEqual({ zoom: 1, x: 600, y: 400 });
    expect(cropOf(framing, photo)).toEqual({ x: 200, y: 0, side: 800, output: 800 });
  });
});

describe("frameView", () => {
  test("draws the photo so that its short side fills the frame, centred", () => {
    expect(frameView(initialFraming(photo), photo, FRAME)).toEqual({
      width: 300,
      height: 200,
      left: -50,
      top: 0,
    });
  });
});

describe("moved", () => {
  test("follows the pointer: dragging right shows what is on the left", () => {
    const framing = moved(initialFraming(photo), photo, FRAME, { dx: 20, dy: 0 });

    // 20 px of the frame are 80 px of the photo at this zoom.
    expect(framing.x).toBe(520);
  });

  test("never shows past the edges of the photo", () => {
    const framing = moved(initialFraming(photo), photo, FRAME, { dx: 1000, dy: -1000 });

    expect(cropOf(framing, photo)).toEqual({ x: 0, y: 0, side: 800, output: 800 });
  });
});

describe("zoomed", () => {
  test("zooms on the centre of the frame", () => {
    const framing = zoomed(initialFraming(photo), photo, 2);

    expect(cropOf(framing, photo)).toEqual({ x: 400, y: 200, side: 400, output: 400 });
  });

  test("keeps the zoom between 1 and 4", () => {
    expect(zoomed(initialFraming(photo), photo, 0.5).zoom).toBe(1);
    expect(zoomed(initialFraming(photo), photo, 9).zoom).toBe(4);
  });

  test("zooming out on an edge brings the frame back into the photo", () => {
    const corner = moved(zoomed(initialFraming(photo), photo, 4), photo, FRAME, {
      dx: -5000,
      dy: -5000,
    });

    expect(cropOf(zoomed(corner, photo, 1), photo)).toEqual({
      x: 400,
      y: 0,
      side: 800,
      output: 800,
    });
  });
});

describe("cropOf", () => {
  test("sends at most 1024 px, at least 128", () => {
    const big = { width: 4000, height: 3000 };
    const small = { width: 300, height: 300 };

    expect(cropOf(initialFraming(big), big).output).toBe(1024);
    expect(cropOf(zoomed(initialFraming(small), small, 4), small)).toEqual({
      x: 112.5,
      y: 112.5,
      side: 75,
      output: 128,
    });
  });
});

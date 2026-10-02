import { type KeyboardEvent, type PointerEvent, useEffect, useEffectEvent, useRef } from "react";

// What a key moves, in px of the frame (Shift: more), and zooms.
const KEY_STEP = 8;

const SHIFT_KEY_STEP = 32;

const ZOOM_STEP = 0.25;

const WHEEL_ZOOM_PER_PIXEL = 0.002;

const ARROWS = new Map([
  ["ArrowLeft", { dx: -1, dy: 0 }],
  ["ArrowRight", { dx: 1, dy: 0 }],
  ["ArrowUp", { dx: 0, dy: -1 }],
  ["ArrowDown", { dx: 0, dy: 1 }],
]);

const ZOOM_KEYS = new Map([
  ["+", ZOOM_STEP],
  ["=", ZOOM_STEP],
  ["-", -ZOOM_STEP],
]);

type Gestures = {
  // By `dx`, `dy` px of the frame: the photo follows.
  onMove: (delta: { dx: number; dy: number }) => void;
  onZoomBy: (step: number) => void;
};

// The frame's gestures: dragged by the pointer (captured, so a drag may leave the frame), zoomed by
// the wheel, both by the keyboard (arrows, + and −). The ref goes on the frame, the handlers too.
export const usePhotoFrameGestures = ({ onMove, onZoomBy }: Gestures) => {
  const frame = useRef<HTMLButtonElement>(null);
  // Where the pointer was at the last move of a drag, null out of one.
  const dragFrom = useRef<{ x: number; y: number } | null>(null);

  const zoomOnWheel = useEffectEvent((event: WheelEvent) => {
    event.preventDefault();
    onZoomBy(-event.deltaY * WHEEL_ZOOM_PER_PIXEL);
  });

  // Not React's onWheel, passive: the dialog would scroll under the zoom.
  useEffect(() => {
    const element = frame.current;

    element?.addEventListener("wheel", zoomOnWheel, { passive: false });

    return () => element?.removeEventListener("wheel", zoomOnWheel);
  }, []);

  const endDrag = () => {
    dragFrom.current = null;
  };

  return {
    ref: frame,
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragFrom.current = { x: event.clientX, y: event.clientY };
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      const from = dragFrom.current;

      if (from !== null) {
        dragFrom.current = { x: event.clientX, y: event.clientY };
        onMove({ dx: event.clientX - from.x, dy: event.clientY - from.y });
      }
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      const arrow = ARROWS.get(event.key);
      const zoom = ZOOM_KEYS.get(event.key);
      const step = event.shiftKey ? SHIFT_KEY_STEP : KEY_STEP;

      if (arrow !== undefined) {
        event.preventDefault();
        onMove({ dx: arrow.dx * step, dy: arrow.dy * step });
      } else if (zoom !== undefined) {
        event.preventDefault();
        onZoomBy(zoom);
      }
    },
  };
};

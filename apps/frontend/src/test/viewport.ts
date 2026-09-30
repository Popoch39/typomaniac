import { act } from "@testing-library/react";

// happy-dom's own API on the test window (vitest.config.ts sets it to 1440 × 900).
declare global {
  interface Window {
    happyDOM: { setViewport: (viewport: { width?: number; height?: number }) => void };
  }
}

// The window's width, as the User resizing it: its media queries follow.
export const setViewportWidth = (width: number) =>
  act(() => window.happyDOM.setViewport({ width }));

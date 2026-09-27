type TierUpRingProps = {
  // Its name for the timeline.
  part: string;
  // Its diameter and the width of its line, in px.
  size: number;
  width: number;
  color: string;
  // An ellipse `height` px tall rather than a circle, its centre `below` px under the Blason's, as
  // a ring spreading over the floor.
  height?: number;
  below?: number;
  // How much it is blurred, in px.
  blur?: number;
};

// A ring that flies out of the Blason's centre: small and lit until then, as in the canvas.
// Placed in a `TierUpCenter`.
export const TierUpRing = ({
  part,
  size,
  width,
  color,
  height = size,
  below = 0,
  blur = 0,
}: TierUpRingProps) => (
  <div
    data-tier-up={part}
    className="absolute rounded-full"
    style={{
      left: -size / 2,
      top: below - height / 2,
      width: size,
      height,
      border: `${width}px solid ${color}`,
      transform: "scale(0.15)",
      filter: blur === 0 ? undefined : `blur(${blur}px)`,
    }}
  />
);

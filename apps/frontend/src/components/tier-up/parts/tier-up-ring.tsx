type TierUpRingProps = {
  // Its name for the timeline.
  part: string;
  // Its diameter and the width of its line, in px.
  size: number;
  width: number;
  color: string;
};

// A ring that flies out of the Blason's centre: small and lit until then, as in the canvas.
// Placed in a `TierUpCenter`.
export const TierUpRing = ({ part, size, width, color }: TierUpRingProps) => (
  <div
    data-tier-up={part}
    className="absolute rounded-full"
    style={{
      left: -size / 2,
      top: -size / 2,
      width: size,
      height: size,
      border: `${width}px solid ${color}`,
      transform: "scale(0.15)",
    }}
  />
);

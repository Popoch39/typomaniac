type TierUpOrbitProps = {
  // Its name for the timeline: the ring fades in with it, its line turns inside.
  part: string;
  // Its diameter and the width of its dashes, in px.
  size: number;
  width: number;
  color: string;
};

// A dashed ring around the Blason, unseen until it fades in, then turning while the Tier-up
// waits. Placed in a `TierUpCenter`.
export const TierUpOrbit = ({ part, size, width, color }: TierUpOrbitProps) => (
  <div
    data-tier-up={part}
    className="absolute opacity-0"
    style={{ left: -size / 2, top: -size / 2, width: size, height: size }}
  >
    <div className="size-full rounded-full" style={{ border: `${width}px dashed ${color}` }} />
  </div>
);

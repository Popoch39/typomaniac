type RankedPlaceLineProps = {
  // At the left: "42 TP".
  value: string;
  // At the right, faint: "58 avant Gold I".
  aside: string;
};

// Under the rank in « Ta place »: its TP, and how far the next.
export const RankedPlaceLine = ({ value, aside }: RankedPlaceLineProps) => (
  <p className="flex justify-between font-mono text-[13px] tabular-nums">
    <span>{value}</span>
    <span className="text-faint">{aside}</span>
  </p>
);

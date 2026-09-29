// Where recharts puts a point of a line, in pixels: none for a second without a value.
type Point = { cx?: number | undefined; cy?: number | undefined };

// The raw of a second: a small dot, lighter than the wpm line.
export const rawDot =
  (color: string) =>
  ({ cx, cy }: Point) =>
    cx === undefined || cy === undefined ? null : (
      <circle cx={cx} cy={cy} r={2.5} fill={color} fillOpacity={0.45} />
    );

// A second with Misses: a small cross.
export const missMark =
  (color: string) =>
  ({ cx, cy }: Point) =>
    cx === undefined || cy === undefined ? null : (
      <path
        d={`M${cx - 3} ${cy - 3}l6 6M${cx + 3} ${cy - 3}l-6 6`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    );

// Where recharts puts the best Duel's dot: the box around it, handed to its label.
type DotBox = { x?: number; y?: number; width?: number };

type WpmBestTagProps = {
  text: string;
  // Given by recharts when it draws the label.
  viewBox?: DotBox;
};

// About the width of a character of the tag, Martian Mono at 13 px, and its padding.
const CHARACTER_WIDTH = 8.2;

const PADDING = 20;

const HEIGHT = 28;

// Above the best Duel of the wpm curve: a light pill with its wpm, « record 128 ».
export const WpmBestTag = ({ text, viewBox }: WpmBestTagProps) => {
  if (viewBox?.x === undefined || viewBox.y === undefined) {
    return null;
  }

  const center = viewBox.x + (viewBox.width ?? 0) / 2;
  const width = text.length * CHARACTER_WIDTH + PADDING;
  const top = viewBox.y - HEIGHT - 8;

  return (
    <g>
      <rect
        x={center - width / 2}
        y={top}
        width={width}
        height={HEIGHT}
        rx={HEIGHT / 2}
        className="fill-foreground"
      />
      <text
        x={center}
        y={top + HEIGHT / 2}
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-background font-mono text-[13px] font-bold"
      >
        {text}
      </text>
    </g>
  );
};

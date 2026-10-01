import { sparkPoints } from "@/components/history/history-week";

type HistoryDuelSparkProps = {
  wpmBySecond: readonly number[];
  // Null once the opponent's User is deleted: the User's line alone.
  opponentWpmBySecond: readonly number[] | null;
};

// Both sides' wpm, second by second, on the same scale: the opponent's line under the User's.
export const HistoryDuelSpark = ({ wpmBySecond, opponentWpmBySecond }: HistoryDuelSparkProps) => {
  const max = Math.max(0, ...wpmBySecond, ...(opponentWpmBySecond ?? []));

  return (
    <svg
      viewBox="0 0 300 56"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block h-14 w-full"
    >
      {opponentWpmBySecond === null ? null : (
        <polyline
          points={sparkPoints(opponentWpmBySecond, max)}
          fill="none"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          className="stroke-opponent-caret opacity-80"
        />
      )}
      <polyline
        points={sparkPoints(wpmBySecond, max)}
        fill="none"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        className="stroke-caret"
      />
    </svg>
  );
};

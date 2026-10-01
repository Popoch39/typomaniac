import { cn } from "cn";

type RoundBreakCountFigureProps = {
  value: number;
  // The figure of the Round's winner: its old value leaves upwards as the new one comes in.
  jumps: boolean;
  tone: string;
};

// One player's figure of the count of the Rounds won.
export const RoundBreakCountFigure = ({ value, jumps, tone }: RoundBreakCountFigureProps) => (
  <div className={cn("grid h-16 items-center overflow-hidden", tone)} aria-hidden>
    {jumps ? (
      <>
        <span data-rb="count-old" className="[grid-area:1/1]">
          {value - 1}
        </span>
        <span data-rb="count-new" className="[grid-area:1/1]">
          {value}
        </span>
      </>
    ) : (
      <span className="[grid-area:1/1]">{value}</span>
    )}
  </div>
);

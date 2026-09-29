import { cn } from "cn";

type RankedPlaceBarProps = {
  label: string;
  value: number;
  of: number;
  // What screen readers read, with what is left to the next rank.
  valueText: string;
  // The fill's colour, as a text colour: the Tier's.
  className: string;
};

// The thin bar of « Ta place », filled to `value` out of `of`. Screen readers read a meter; the
// drawing is hidden.
export const RankedPlaceBar = ({ label, value, of, valueText, className }: RankedPlaceBarProps) => (
  <div>
    <meter
      className="sr-only"
      aria-label={label}
      min={0}
      max={of}
      value={value}
      aria-valuetext={valueText}
    />
    <div aria-hidden="true" className={cn("h-0.5 bg-secondary", className)}>
      <div className="h-full bg-current" style={{ width: `${Math.min(value / of, 1) * 100}%` }} />
    </div>
  </div>
);

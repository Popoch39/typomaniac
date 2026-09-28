type PrototypeSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

// PROTOTYPE, throwaway: one tunable value, its number always in sight.
export const PrototypeSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: PrototypeSliderProps) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="flex justify-between">
      {label}
      <span className="font-mono tabular-nums text-text-secondary">{value}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      className="accent-primary"
      onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
    />
  </label>
);

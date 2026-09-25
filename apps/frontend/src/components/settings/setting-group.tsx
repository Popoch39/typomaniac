import { Button } from "@/components/ui/button";

export type SettingOption<T> = { value: T; label: string };

type SettingGroupProps<T> = {
  label: string;
  options: readonly SettingOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

// One setting, as segmented pills on one surface: the chosen option is pressed, filled with the accent.
export const SettingGroup = <T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SettingGroupProps<T>) => (
  <fieldset className="flex min-w-0 gap-1 rounded-full bg-card p-1">
    <legend className="sr-only">{label}</legend>
    {options.map((option) => (
      <Button
        key={option.value}
        variant="ghost"
        size="sm"
        aria-pressed={option.value === value}
        onClick={() => onChange(option.value)}
        className="rounded-full text-muted-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/85"
      >
        {option.label}
      </Button>
    ))}
  </fieldset>
);

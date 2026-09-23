import { Button } from "@/components/ui/button";

export type SettingOption<T> = { value: T; label: string };

type SettingGroupProps<T> = {
  label: string;
  options: readonly SettingOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

// One setting, as a row of buttons: the chosen option is pressed.
export const SettingGroup = <T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SettingGroupProps<T>) => (
  <fieldset className="flex min-w-0">
    <legend className="sr-only">{label}</legend>
    {options.map((option) => (
      <Button
        key={option.value}
        variant="ghost"
        size="sm"
        aria-pressed={option.value === value}
        onClick={() => onChange(option.value)}
        className="text-muted-foreground aria-pressed:text-caret"
      >
        {option.label}
      </Button>
    ))}
  </fieldset>
);

import { cn } from "cn";

import { Button } from "@/components/ui/button";

export type SettingOption<T> = { value: T; label: string };

type SettingGroupProps<T> = {
  label: string;
  options: readonly SettingOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // The surface's own look, where the pills lie on a card rather than on the page.
  className?: string;
  // The pills' own look, where the chosen one is not filled with the accent.
  optionClassName?: string;
};

// One setting, as segmented pills on one surface: the chosen option is pressed, filled with the
// accent unless `optionClassName` paints it otherwise.
export const SettingGroup = <T extends string | number>({
  label,
  options,
  value,
  onChange,
  className,
  optionClassName,
}: SettingGroupProps<T>) => (
  <fieldset className={cn("flex min-w-0 gap-1 rounded-full bg-card p-1", className)}>
    <legend className="sr-only">{label}</legend>
    {options.map((option) => (
      <Button
        key={option.value}
        variant="ghost"
        size="sm"
        aria-pressed={option.value === value}
        onClick={() => onChange(option.value)}
        className={cn(
          "rounded-full text-muted-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/85",
          optionClassName,
        )}
      >
        {option.label}
      </Button>
    ))}
  </fieldset>
);

import { cn } from "cn";

import { RadioGroupItem } from "@/components/ui/radio-group";

type ReplayChoiceProps<Value> = {
  value: Value;
  label: string;
  // Its own colour once chosen, for a choice that stands for a player; the accent otherwise.
  className?: string;
};

const defaultTone = "has-data-checked:bg-primary has-data-checked:text-primary-foreground";

// One choice of a Replay control, a pill named by its label: the chosen one is filled, the others
// muted.
export const ReplayChoice = <Value,>({ value, label, className }: ReplayChoiceProps<Value>) => (
  <label
    className={cn(
      "flex h-11 cursor-pointer items-center rounded-full px-3.5 text-sm font-semibold text-muted-foreground hover:not-has-data-checked:text-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
      className ?? defaultTone,
    )}
  >
    <RadioGroupItem value={value} className="sr-only" />
    {label}
  </label>
);

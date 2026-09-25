import { cn } from "cn";

import { RadioGroupItem } from "@/components/ui/radio-group";

type ReplayChoiceProps<Value> = {
  value: Value;
  label: string;
  // Its own colour, for a choice that stands for a player; the hover colour otherwise.
  className?: string;
};

// One choice of a Replay control, named by its label.
export const ReplayChoice = <Value,>({ value, label, className }: ReplayChoiceProps<Value>) => (
  <label className={cn("flex cursor-pointer items-center gap-2", className ?? "hover:text-caret")}>
    <RadioGroupItem value={value} />
    {label}
  </label>
);

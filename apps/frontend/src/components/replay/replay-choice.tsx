import { RadioGroupItem } from "@/components/ui/radio-group";

type ReplayChoiceProps<Value> = { value: Value; label: string };

// One choice of a Replay control, named by its label.
export const ReplayChoice = <Value,>({ value, label }: ReplayChoiceProps<Value>) => (
  <label className="flex cursor-pointer items-center gap-2 hover:text-caret">
    <RadioGroupItem value={value} />
    {label}
  </label>
);

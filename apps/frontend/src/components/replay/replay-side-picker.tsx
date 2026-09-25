import { cn } from "cn";

import { ReplayChoice } from "@/components/replay/replay-choice";
import type { ReplayView } from "@/components/replay/replay-sides";
import { RadioGroup } from "@/components/ui/radio-group";

// Each choice keeps its player's colour, so the one shown stands out by its weight.
const selectedClassName = "has-data-checked:font-bold has-data-checked:underline";

type ReplaySidePickerProps = {
  view: ReplayView;
  opponentName: string;
  onChange: (view: ReplayView) => void;
};

// Whose Run the Replay shows, the User's or their opponent's, by mouse or arrow keys.
export const ReplaySidePicker = ({ view, opponentName, onChange }: ReplaySidePickerProps) => (
  <RadioGroup
    aria-label="Run affiché"
    value={view}
    onValueChange={onChange}
    className="flex w-auto gap-4"
  >
    <ReplayChoice value="own" label="Toi" className={cn("text-caret", selectedClassName)} />
    <ReplayChoice
      value="opponent"
      label={opponentName}
      className={cn("text-opponent-caret", selectedClassName)}
    />
  </RadioGroup>
);

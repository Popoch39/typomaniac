import { ReplayChoice } from "@/components/replay/replay-choice";
import type { ReplayView } from "@/components/replay/replay-sides";
import { RadioGroup } from "@/components/ui/radio-group";

// Each choice keeps its player's colour: in its text, then filling its pill once chosen, under the
// ink the Theme lays on it.
const ownTone = "text-caret has-data-checked:bg-caret has-data-checked:text-on-brand";

const opponentTone =
  "text-opponent-caret has-data-checked:bg-opponent-caret has-data-checked:text-on-opponent";

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
    className="flex w-auto gap-1 rounded-full bg-card p-1"
  >
    <ReplayChoice value="own" label="Toi" className={ownTone} />
    <ReplayChoice value="opponent" label={opponentName} className={opponentTone} />
  </RadioGroup>
);

import { ReplayChoice } from "@/components/replay/replay-choice";
import { replayRunName } from "@/components/replay/replay-run-name";
import type { ReplayView } from "@/components/replay/replay-sides";
import { RadioGroup } from "@/components/ui/radio-group";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Each choice is a little wider than a speed, and fills its pill with its player's colour once
// chosen, under the ink the Theme lays on it.
const ownChoice = "px-4 has-data-checked:bg-caret has-data-checked:text-on-brand";

const opponentChoice = "px-4 has-data-checked:bg-opponent-caret has-data-checked:text-on-opponent";

type ReplaySidePickerProps = {
  view: ReplayView;
  opponentName: string;
  onChange: (view: ReplayView) => void;
};

// Whose Run the Replay shows, the User's or their opponent's, by mouse or arrow keys.
export const ReplaySidePicker = ({ view, opponentName, onChange }: ReplaySidePickerProps) => {
  const locale = useLocale();

  return (
    <RadioGroup
      aria-label={m.replay_side({}, { locale })}
      value={view}
      onValueChange={onChange}
      className="ml-auto flex w-auto gap-1 rounded-full bg-surface-2 p-1"
    >
      <ReplayChoice
        value="own"
        label={replayRunName("own", opponentName, locale)}
        className={ownChoice}
      />
      <ReplayChoice
        value="opponent"
        label={replayRunName("opponent", opponentName, locale)}
        className={opponentChoice}
      />
    </RadioGroup>
  );
};

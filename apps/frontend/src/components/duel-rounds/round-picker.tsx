import { ReplayChoice } from "@/components/replay/replay-choice";
import { RadioGroup } from "@/components/ui/radio-group";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type RoundPickerProps = {
  // The indices of the Rounds played, from 0: never one that was not.
  rounds: readonly number[];
  value: number;
  onChange: (round: number) => void;
};

// Which Round of a Bo3 is shown, R1 / R2 / R3, by mouse or arrow keys: on the Duel end's chart and
// in the Replay.
export const RoundPicker = ({ rounds, value, onChange }: RoundPickerProps) => {
  const locale = useLocale();

  return (
    <RadioGroup
      aria-label={m.round_picker({}, { locale })}
      value={value}
      onValueChange={onChange}
      className="flex w-auto gap-1 rounded-full bg-surface-2 p-1"
    >
      {rounds.map((round) => (
        <ReplayChoice
          key={round}
          value={round}
          label={m.round_short({ n: round + 1 }, { locale })}
        />
      ))}
    </RadioGroup>
  );
};

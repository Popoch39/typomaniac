import { type ReplaySpeed, replaySpeeds } from "@/components/replay/replay-clock";
import { ReplayChoice } from "@/components/replay/replay-choice";
import { RadioGroup } from "@/components/ui/radio-group";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type ReplaySpeedPickerProps = { speed: ReplaySpeed; onChange: (speed: ReplaySpeed) => void };

// 0,5×, 1× or 2× (0.5× in English), by mouse or arrow keys.
export const ReplaySpeedPicker = ({ speed, onChange }: ReplaySpeedPickerProps) => {
  const locale = useLocale();

  return (
    <RadioGroup
      aria-label={m.replay_speed({}, { locale })}
      value={speed}
      onValueChange={onChange}
      className="flex w-auto gap-1 rounded-full bg-surface-2 p-1"
    >
      {replaySpeeds.map((choice) => (
        <ReplayChoice
          key={choice}
          value={choice}
          label={m.replay_speed_value({ value: numberFormat(locale).format(choice) }, { locale })}
        />
      ))}
    </RadioGroup>
  );
};

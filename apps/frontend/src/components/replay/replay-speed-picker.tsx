import { type ReplaySpeed, replaySpeeds } from "@/components/replay/replay-clock";
import { ReplayChoice } from "@/components/replay/replay-choice";
import { RadioGroup } from "@/components/ui/radio-group";

type ReplaySpeedPickerProps = { speed: ReplaySpeed; onChange: (speed: ReplaySpeed) => void };

// 0,5×, 1× or 2×, by mouse or arrow keys.
export const ReplaySpeedPicker = ({ speed, onChange }: ReplaySpeedPickerProps) => (
  <RadioGroup
    aria-label="Vitesse de lecture"
    value={speed}
    onValueChange={onChange}
    className="flex w-auto gap-4"
  >
    {replaySpeeds.map((choice) => (
      <ReplayChoice key={choice} value={choice} label={`${choice.toLocaleString("fr")}×`} />
    ))}
  </RadioGroup>
);

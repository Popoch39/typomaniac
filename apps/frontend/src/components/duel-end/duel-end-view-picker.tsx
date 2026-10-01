import { ReplayChoice } from "@/components/replay/replay-choice";
import { RadioGroup } from "@/components/ui/radio-group";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// How a Bo3's end shows the Duel in its last column: its chart, second by second, or its figures.
export type DuelEndView = "chart" | "tape";

type DuelEndViewPickerProps = { view: DuelEndView; onChange: (view: DuelEndView) => void };

// The chart or the tale of the tape, by mouse or arrow keys.
export const DuelEndViewPicker = ({ view, onChange }: DuelEndViewPickerProps) => {
  const locale = useLocale();

  return (
    <RadioGroup
      aria-label={m.duel_ended_view({}, { locale })}
      value={view}
      onValueChange={onChange}
      className="flex w-auto gap-1 self-start rounded-full bg-surface-2 p-1"
    >
      <ReplayChoice value="chart" label={m.duel_ended_view_chart({}, { locale })} />
      <ReplayChoice value="tape" label={m.duel_ended_view_tape({}, { locale })} />
    </RadioGroup>
  );
};

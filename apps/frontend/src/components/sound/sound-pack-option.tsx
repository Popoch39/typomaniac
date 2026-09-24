import { useSoundPreview } from "@/components/sound/sound-preview-context";
import { RadioGroupItem } from "@/components/ui/radio-group";
import type { SoundChoice } from "@/stores/sound-store";

type SoundPackOptionProps = { value: SoundChoice; label: string };

// One choice of the picker: hovering it plays one of its keys, to choose by ear.
export const SoundPackOption = ({ value, label }: SoundPackOptionProps) => {
  const preview = useSoundPreview();

  return (
    <label
      className="flex cursor-pointer items-center gap-2 px-1 py-1.5 hover:text-caret"
      onPointerEnter={() => preview(value)}
    >
      <RadioGroupItem value={value} />
      {label}
    </label>
  );
};

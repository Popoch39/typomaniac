import { soundPacks } from "@/audio/sound-packs";
import { SoundPackOption } from "@/components/sound/sound-pack-option";
import { useSoundPreview } from "@/components/sound/sound-preview-context";
import { RadioGroup } from "@/components/ui/radio-group";
import { type SoundChoice, useSoundStore } from "@/stores/sound-store";

const choices: readonly { value: SoundChoice; label: string }[] = [
  ...soundPacks.map((pack) => ({ value: pack.id, label: pack.label })),
  { value: "off", label: "off" },
];

// The Sound packs and "off", by mouse or arrow keys: the pack chosen plays one of its keys.
export const SoundPackPicker = () => {
  const pack = useSoundStore((state) => state.pack);
  const setPack = useSoundStore((state) => state.setPack);
  const preview = useSoundPreview();

  const choose = (choice: SoundChoice) => {
    setPack(choice);
    preview(choice);
  };

  return (
    <RadioGroup aria-label="Sound pack" value={pack} onValueChange={choose} className="gap-0">
      {choices.map((choice) => (
        <SoundPackOption key={choice.value} value={choice.value} label={choice.label} />
      ))}
    </RadioGroup>
  );
};

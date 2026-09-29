import { soundPacks } from "@/audio/sound-packs";
import { SoundPackOption } from "@/components/sound/sound-pack-option";
import { useSoundPreview } from "@/components/sound/sound-preview-context";
import { RadioGroup } from "@/components/ui/radio-group";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { type SoundChoice, useSoundStore } from "@/stores/sound-store";

// The Sound packs and "off", by mouse or arrow keys: the pack chosen plays one of its keys. The
// packs keep their names in every Locale.
export const SoundPackPicker = () => {
  const locale = useLocale();
  const pack = useSoundStore((state) => state.pack);
  const setPack = useSoundStore((state) => state.setPack);
  const preview = useSoundPreview();

  const choices: readonly { value: SoundChoice; label: string }[] = [
    ...soundPacks.map((soundPack) => ({ value: soundPack.id, label: soundPack.label })),
    { value: "off", label: m.sound_pack_off({}, { locale }) },
  ];

  const choose = (choice: SoundChoice) => {
    setPack(choice);
    preview(choice);
  };

  return (
    <RadioGroup
      aria-label={m.sound_pack_label({}, { locale })}
      value={pack}
      onValueChange={choose}
      className="gap-0"
    >
      {choices.map((choice) => (
        <SoundPackOption key={choice.value} value={choice.value} label={choice.label} />
      ))}
    </RadioGroup>
  );
};

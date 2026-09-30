import { PlayCard } from "@/components/play/play-card";
import { TrainingPresetLink } from "@/components/play/training-preset-link";
import { TRAINING_PRESETS, trainingPresetId } from "@/components/play/training-presets";
import { TrainingSample } from "@/components/play/training-sample";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Training card: a glimpse of the Text, then its presets, each opening a Run.
export const TrainingCard = () => {
  const locale = useLocale();

  return (
    <PlayCard
      title={m.play_training_title({}, { locale })}
      pitch={m.play_training_pitch({}, { locale })}
      visual={<TrainingSample />}
      className="bg-card"
      pitchClassName="text-muted-foreground"
    >
      <TooltipProvider>
        <ul
          aria-label={m.play_training_presets({}, { locale })}
          className="@container flex flex-wrap gap-1.5 pt-1.5"
        >
          {TRAINING_PRESETS.map((preset) => (
            <li key={trainingPresetId(preset)}>
              <TrainingPresetLink preset={preset} />
            </li>
          ))}
        </ul>
      </TooltipProvider>
    </PlayCard>
  );
};

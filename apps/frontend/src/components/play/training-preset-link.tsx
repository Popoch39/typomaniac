import { Link } from "@tanstack/react-router";

import { RUN_PATH } from "@/components/play/play-paths";
import { type TrainingPreset, trainingPresetLabel } from "@/components/play/training-presets";
import { useChoosePreset } from "@/components/play/use-choose-preset";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";

// A Training preset, a pill: sets the Run's settings to it, then opens the Run.
export const TrainingPresetLink = ({ preset }: { preset: TrainingPreset }) => {
  const locale = useLocale();
  const choosePreset = useChoosePreset();

  return (
    <Button
      variant="secondary"
      nativeButton={false}
      render={<Link to={RUN_PATH} onClick={() => choosePreset(preset)} />}
      className="rounded-full px-4.5 font-mono text-sm"
    >
      {trainingPresetLabel(preset, locale)}
    </Button>
  );
};

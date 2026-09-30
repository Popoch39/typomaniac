import { Link } from "@tanstack/react-router";
import { TimerIcon, WholeWordIcon } from "lucide-react";

import { RUN_PATH } from "@/components/play/play-paths";
import {
  type TrainingPreset,
  trainingPresetLabel,
  trainingPresetShortLabel,
} from "@/components/play/training-presets";
import { useChoosePreset } from "@/components/play/use-choose-preset";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocale } from "@/locale/use-locale";

// A Training preset, a pill: sets the Run's settings to it, then opens the Run. Short, its Mode's
// icon then « 30 s », for the three to hold on one line of a narrow card; named « time 30 », as
// the settings bar says it, and said again in a tooltip.
export const TrainingPresetLink = ({ preset }: { preset: TrainingPreset }) => {
  const locale = useLocale();
  const choosePreset = useChoosePreset();
  const label = trainingPresetLabel(preset, locale);
  const ModeIcon = preset.mode === "time" ? TimerIcon : WholeWordIcon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            nativeButton={false}
            aria-label={label}
            render={<Link to={RUN_PATH} onClick={() => choosePreset(preset)} />}
            className="gap-1.5 rounded-full px-3 font-mono text-sm @max-[13rem]:px-2 @max-[13rem]:text-xs"
          />
        }
      >
        {/* The three hold on one line of the list: the icon gives way first below 20rem, then the
            padding and the type size below 13rem (a card of a 1024 px window). */}
        <ModeIcon aria-hidden="true" className="@max-[20rem]:hidden" />
        {trainingPresetShortLabel(preset, locale)}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
};

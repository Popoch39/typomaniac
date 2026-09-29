import { useNavigate } from "@tanstack/react-router";
import { RotateCcwIcon } from "lucide-react";

import { IntroDevSetting } from "@/components/intro-dev/intro-dev-setting";
import { replayIntro } from "@/components/intro-dev/intro-replay";
import { themeName } from "@/components/theme/theme-text";
import { THEMES } from "@/components/theme/themes";
import { Button } from "@/components/ui/button";
import { INTRO_SPEEDS, SHELL_DELAYS, useIntroReplayStore } from "@/stores/intro-replay-store";
import { useThemeStore } from "@/stores/theme-store";

const SPEED_OPTIONS = INTRO_SPEEDS.map((speed) => ({
  value: speed,
  label: `${String(speed).replace(".", ",")}×`,
}));

const SHELL_DELAY_OPTIONS = SHELL_DELAYS.map((delay) => ({ value: delay, label: `${delay} s` }));

// A dev page, in French only.
const THEME_OPTIONS = THEMES.map((theme) => ({
  value: theme.id,
  label: themeName(theme.id, "fr"),
}));

// The replay's options, then Rejouer: the Intro plays again with them, over the home page it leads
// to. The Theme is the app's own, applied at once.
export const IntroDevControls = () => {
  const navigate = useNavigate();
  const speed = useIntroReplayStore((store) => store.speed);
  const shellDelay = useIntroReplayStore((store) => store.shellDelay);
  const setSpeed = useIntroReplayStore((store) => store.setSpeed);
  const setShellDelay = useIntroReplayStore((store) => store.setShellDelay);
  const theme = useThemeStore((store) => store.theme);
  const setTheme = useThemeStore((store) => store.setTheme);

  const replay = () => {
    replayIntro();
    void navigate({ to: "/" });
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <IntroDevSetting label="Vitesse" options={SPEED_OPTIONS} value={speed} onChange={setSpeed} />
      <IntroDevSetting
        label="Shell prêt"
        options={SHELL_DELAY_OPTIONS}
        value={shellDelay}
        onChange={setShellDelay}
      />
      <IntroDevSetting label="Theme" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      <Button onClick={replay}>
        <RotateCcwIcon aria-hidden />
        Rejouer
      </Button>
    </div>
  );
};

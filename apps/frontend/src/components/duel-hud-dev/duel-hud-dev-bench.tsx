import { useState } from "react";

import { DuelHudDevControls } from "@/components/duel-hud-dev/duel-hud-dev-controls";
import { DuelHudDevStage } from "@/components/duel-hud-dev/duel-hud-dev-stage";
import { useScriptedTime } from "@/components/duel-hud-dev/use-scripted-time";

// The scripted Duel in the real HUD, played in a loop at first, frozen on a moment on demand.
export const DuelHudDevBench = () => {
  const [frozenAt, setFrozenAt] = useState<number | null>(null);
  const { t, clock } = useScriptedTime(frozenAt);

  return (
    <>
      <DuelHudDevStage t={t} clock={clock} />
      <DuelHudDevControls frozenAt={frozenAt} onFreeze={setFrozenAt} />
    </>
  );
};

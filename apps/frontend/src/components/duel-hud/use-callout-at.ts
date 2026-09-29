import { useEffect, useEffectEvent, useState } from "react";

import { type Callout, calloutAt } from "@/components/duel-hud/callouts";
import type { DuelHudModel } from "@/components/duel-hud/duel-hud-model";
import { useClock } from "@/components/run/clock-context";
import { useLocale } from "@/locale/use-locale";

// A Callout, told apart from another by when it comes and what it says.
export const calloutKey = (callout: Callout | null) =>
  callout === null ? "" : `${callout.at}:${callout.text}:${callout.value}`;

// When the Duel's clock was read last, in ms since GO, and the HUD's step it was read in: a
// reading from another step is stale.
type Reading = { step: number; elapsed: number };

// The Callout the HUD shows, on the Duel's clock read on every frame, as its timelines are: it
// comes in on the frame of its Keystroke or of its Lead change, never on the HUD's next step
// (`elapsed` moves by a tenth of a second). A render only when it changes.
export const useCalloutAt = (model: DuelHudModel) => {
  const clock = useClock();
  const locale = useLocale();

  const [reading, setReading] = useState<Reading>(() => ({
    step: model.elapsed,
    elapsed: model.elapsed,
  }));

  const elapsed =
    reading.step === model.elapsed ? Math.max(model.elapsed, reading.elapsed) : model.elapsed;

  const callout = calloutAt({ ...model, elapsed }, locale);
  const key = calloutKey(callout);

  const onFrame = useEffectEvent(() => {
    const now = clock() - model.startsAt;

    if (now > elapsed && calloutKey(calloutAt({ ...model, elapsed: now }, locale)) !== key) {
      setReading({ step: model.elapsed, elapsed: now });
    }
  });

  useEffect(() => {
    let frame = 0;

    const read = () => {
      onFrame();
      frame = requestAnimationFrame(read);
    };

    frame = requestAnimationFrame(read);

    return () => cancelAnimationFrame(frame);
  }, []);

  return callout;
};

import { gsap } from "gsap";
import { type RefObject, useEffect, useEffectEvent } from "react";

import {
  frozenTime,
  type KeystrokeParams,
  wavesAt,
} from "@/components/aura-maniac-prototype/keystroke-prototype";
import { openPrototypePainter } from "@/components/aura-maniac-prototype/prototype-painter";

// PROTOTYPE, throwaway: draws the keystroke waves on `canvas` at every tick of GSAP's clock,
// shifted by `offset`, or frozen mid-burst; the latest params read at each frame, so tuning never
// reopens the context. Released on unmount.
export const usePrototypeWaves = (
  canvas: RefObject<HTMLCanvasElement | null>,
  params: KeystrokeParams,
  offset: number,
  frozen: boolean,
) => {
  const uniformsAt = useEffectEvent((time: number) => {
    const { ages, flash } = wavesAt(frozen ? frozenTime(params) : time + offset, params);

    return {
      ages,
      flash,
      birth: params.birth,
      reach: params.reach,
      curve: params.curve,
      thickness: params.thickness,
      trail: params.trail,
      halo: params.halo,
      flashGain: params.flash,
    };
  });

  useEffect(() => {
    const element = canvas.current;
    const painter = element === null ? null : openPrototypePainter(element);

    if (painter === null) {
      return;
    }

    const tick = (time: number) => painter.draw(uniformsAt(time));

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      painter.dispose();
    };
  }, [canvas]);
};

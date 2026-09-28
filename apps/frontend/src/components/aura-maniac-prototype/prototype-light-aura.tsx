import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type ReactNode, useRef } from "react";

import {
  CADENCES,
  frozenTime,
  type KeystrokeParams,
  MAX_WAVES,
} from "@/components/aura-maniac-prototype/keystroke-prototype";
import { glowId, METALS, paint } from "@/components/tier/sprite/tier-sprite-paint";

gsap.registerPlugin(useGSAP);

type PrototypeLightAuraProps = {
  params: KeystrokeParams;
  offset: number;
  frozen: boolean;
  children: ReactNode;
};

const RINGS = Array.from({ length: MAX_WAVES }, (_, index) => index);

// PROTOTYPE, throwaway: the light Aura's keystroke rings behind the drawing. A pool of rings, one
// sent out on each hit of the cadence (scale + opacity, around the Ornament's centre), the glow
// lit on each hit. One looping timeline, rebuilt when a param changes; frozen mid-burst, it is
// paused there.
export const PrototypeLightAura = ({
  params,
  offset,
  frozen,
  children,
}: PrototypeLightAuraProps) => {
  const scope = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = scope.current;

      if (root === null) {
        return;
      }

      const rings = [...root.querySelectorAll("[data-prototype-ring]")];
      const glow = root.querySelector("[data-prototype-glow]");
      const { period, hits } = CADENCES[params.cadence];
      const timeline = gsap.timeline({ repeat: -1 });

      hits.forEach((hit, index) => {
        timeline.fromTo(
          rings[index % rings.length] ?? [],
          { scale: 1, opacity: 0.9 },
          {
            scale: params.lightScale,
            opacity: 0,
            duration: params.lightLife,
            ease: "power2.out",
            svgOrigin: "60 60",
            overwrite: "auto",
            immediateRender: false,
          },
          hit,
        );

        if (glow !== null) {
          timeline.fromTo(
            glow,
            { opacity: 0.55 + 0.45 * params.flash },
            {
              opacity: 0.55,
              duration: params.flashDecay * 3,
              ease: "power2.out",
              immediateRender: false,
            },
            hit,
          );
        }
      });

      timeline.set({}, {}, period);
      timeline.totalTime(frozen ? frozenTime(params) : offset % period);

      if (frozen) {
        timeline.pause();
      }
    },
    { scope, dependencies: [params, offset, frozen], revertOnUpdate: true },
  );

  return (
    <span ref={scope} className="relative isolate block size-full">
      <svg
        viewBox="0 0 120 120"
        className="pointer-events-none absolute inset-0 -z-10 size-full overflow-visible"
        aria-hidden
      >
        <circle
          data-prototype-glow
          cx={60}
          cy={60}
          r={62}
          fill={paint(glowId("maniac"))}
          opacity={0.55}
        />
        {RINGS.map((ring) => (
          <circle
            key={ring}
            data-prototype-ring
            cx={60}
            cy={60}
            r={40}
            fill="none"
            stroke={METALS.maniac.mid}
            strokeWidth={params.lightWidth}
            opacity={0}
          />
        ))}
      </svg>
      {children}
    </span>
  );
};

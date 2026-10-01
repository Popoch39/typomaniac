import { gsap } from "gsap";

import { layGhost, ratio } from "@/components/duel-scene/scene-ghost";
import type { RoundMorph } from "@/components/round-break/round-morph";

// How long the band takes to become the header, or the header the band, in seconds.
export const ROUND_MORPH_SECONDS = 0.5;

const MORPH_EASE = "power3.inOut";

// The copy of what slides fades out on the way; what leaves fades out and sinks.
const GHOST_OUT_SECONDS = 0.3;

const LEAVING_SECONDS = 0.3;

const between = (from: number, to: number, progress: number) => from + (to - from) * progress;

// Plays, from now, `element` coming out of `morph.from`: it leaves the recorded box and slides and
// resizes into its own place, read on every frame, while the copy of what it was follows it and
// fades out, and the copy of what leaves (`morph.leaving`) fades and sinks. Under reduced motion,
// the copies only fade out, the element there at once. The function returned takes the copies off
// and the element's inline styles away.
export const slideFromMorph = (element: HTMLElement, morph: RoundMorph, reduced: boolean) => {
  const { from, leaving } = morph;
  const ghosts = [from, ...(leaving === null ? [] : [leaving])];

  for (const ghost of ghosts) {
    layGhost(ghost);
  }

  const timeline = gsap.timeline();

  if (!reduced) {
    const moving = { progress: 0 };

    const place = () => {
      gsap.set(element, { x: 0, y: 0, scaleX: 1, scaleY: 1, transformOrigin: "0 0" });

      const own = element.getBoundingClientRect();
      const left = between(from.rect.left, own.left, moving.progress);
      const top = between(from.rect.top, own.top, moving.progress);
      const width = between(from.rect.width, own.width, moving.progress);
      const height = between(from.rect.height, own.height, moving.progress);

      gsap.set(element, {
        x: left - own.left,
        y: top - own.top,
        scaleX: ratio(width, own.width),
        scaleY: ratio(height, own.height),
      });
      gsap.set(from.ghost, {
        x: left,
        y: top,
        scaleX: ratio(width, from.width),
        scaleY: ratio(height, from.height),
      });
    };

    place();
    timeline.to(
      moving,
      {
        progress: 1,
        duration: ROUND_MORPH_SECONDS,
        ease: MORPH_EASE,
        onUpdate: place,
        onComplete: () => {
          gsap.set(element, { clearProps: "transform,transformOrigin" });
        },
      },
      0,
    );
  }

  timeline.to(
    from.ghost,
    { opacity: 0, duration: GHOST_OUT_SECONDS, ease: "power1.out", immediateRender: false },
    0,
  );

  if (leaving !== null) {
    timeline.to(
      leaving.ghost,
      {
        opacity: 0,
        y: reduced ? `+=0` : "+=24",
        duration: LEAVING_SECONDS,
        ease: "power1.in",
        immediateRender: false,
      },
      0,
    );
  }

  timeline.call(
    () => {
      for (const { ghost } of ghosts) {
        ghost.remove();
      }
    },
    [],
    ROUND_MORPH_SECONDS,
  );

  return () => {
    for (const { ghost } of ghosts) {
      ghost.remove();
    }

    gsap.set(element, { clearProps: "transform,transformOrigin" });
  };
};

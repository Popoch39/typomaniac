import { gsap } from "gsap";

import type { BandMorph } from "@/components/duel-end/band-morph";
import { ratio } from "@/components/duel-scene/scene-ghost";

// How long the band takes to go from the HUD to its place in the Duel end, in seconds.
export const BAND_MORPH_SECONDS = 0.5;

const MORPH_EASE = "power3.inOut";

// The HUD's figures fade out as the band leaves, the Duel end's fade in on the way.
const GHOST_OUT_SECONDS = 0.25;

const FIGURES_IN_AT = 0.2;

const FIGURES_IN_SECONDS = 0.3;

const between = (from: number, to: number, progress: number) => from + (to - from) * progress;

// On `timeline`, from time 0: the Duel end's band (`data-entrance=band`) leaves the HUD's box and
// grows and slides into its place, its slant sliding from the Lead's split to the User's share;
// the HUD's figures fade out with it and the band's own Scores (`data-band-figures`) fade in. Its
// place is read on every frame, so it lands exactly there, however the page around it moves
// meanwhile (the sidebar coming back). The function returned takes the copy off and the inline
// styles away; null without a band to move.
export const morphBand = (timeline: gsap.core.Timeline, screen: HTMLElement, morph: BandMorph) => {
  const band = screen.querySelector<HTMLElement>("[data-entrance=band]");

  if (band === null) {
    return null;
  }

  const { ghost, rect } = morph;
  const moving = { progress: 0 };

  // Where the band stands now, between the HUD's box and its own, then the copy over it.
  const place = () => {
    gsap.set(band, { x: 0, y: 0, scaleX: 1, scaleY: 1, transformOrigin: "0 0" });

    const own = band.getBoundingClientRect();
    const left = between(rect.left, own.left, moving.progress);
    const top = between(rect.top, own.top, moving.progress);
    const width = between(rect.width, own.width, moving.progress);
    const height = between(rect.height, own.height, moving.progress);

    gsap.set(band, {
      x: left - own.left,
      y: top - own.top,
      scaleX: ratio(width, own.width),
      scaleY: ratio(height, own.height),
    });
    gsap.set(ghost, {
      x: left,
      y: top,
      scaleX: ratio(width, morph.width),
      scaleY: ratio(height, morph.height),
    });
  };

  const settle = () => gsap.set(band, { clearProps: "transform,transformOrigin" });

  document.body.append(ghost);

  timeline
    .fromTo(
      moving,
      { progress: 0 },
      {
        progress: 1,
        duration: BAND_MORPH_SECONDS,
        ease: MORPH_EASE,
        onUpdate: place,
        onComplete: settle,
      },
      0,
    )
    .fromTo(
      band,
      { "--share-from": morph.split, "--share-in": 0 },
      {
        "--share-in": 1,
        duration: BAND_MORPH_SECONDS,
        ease: MORPH_EASE,
        clearProps: "--share-from,--share-in",
      },
      0,
    )
    .to(
      ghost,
      {
        opacity: 0,
        duration: GHOST_OUT_SECONDS,
        ease: "power1.out",
        immediateRender: false,
        onComplete: () => ghost.remove(),
      },
      0,
    );

  const figures = band.querySelector("[data-band-figures]");

  if (figures !== null) {
    timeline.fromTo(
      figures,
      { opacity: 0 },
      { opacity: 1, duration: FIGURES_IN_SECONDS, clearProps: "opacity" },
      FIGURES_IN_AT,
    );
  }

  place();

  return () => {
    ghost.remove();
    settle();
  };
};

// Under reduced motion: the HUD's figures fade out, briefly, over the Duel end, there at once.
export const fadeBandGhost = (morph: BandMorph) => {
  const { ghost, rect } = morph;

  document.body.append(ghost);
  gsap.set(ghost, {
    x: rect.left,
    y: rect.top,
    scaleX: ratio(rect.width, morph.width),
    scaleY: ratio(rect.height, morph.height),
  });
  gsap.to(ghost, {
    opacity: 0,
    duration: GHOST_OUT_SECONDS,
    ease: "power1.out",
    onComplete: () => ghost.remove(),
  });

  return () => ghost.remove();
};

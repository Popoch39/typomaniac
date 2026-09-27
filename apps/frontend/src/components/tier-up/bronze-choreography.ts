import type { Choreography } from "@/components/tier-up/tier-up-choreography";
import { part } from "@/components/tier-up/tier-up-part";
import { TIER_UP_SPARKS } from "@/components/tier-up/spark-burst";

// A caption line rising into place.
const RISE = { opacity: 0, y: 28 };

const RISEN = { opacity: 1, y: 0, duration: 0.5 };

// Fer → Bronze, as its artboard « 1 · Fer → Bronze » plays it, in about 3.5 s: the iron shield
// rises in, then dissolves into light; the bronze outline traces itself, fills in with a flash and
// lands with a ring, sparks and the halo opening; then « Nouveau palier », the name letter by
// letter, the route and « Continuer ». Transforms and opacity, but for the dissolve's and the
// letters' blur. From the wait on, the halo breathes.
export const bronzeChoreography: Choreography = {
  beats: { dissolve: 1, impact: 2.3, name: 2.7, wait: 4 },
  sounds: {
    dissolve: "tier-up-bronze-dissolve",
    impact: "tier-up-bronze-impact",
    name: "tier-up-bronze-name",
  },
  intro: (timeline) => {
    timeline
      .fromTo(part("ground"), { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0)
      .fromTo(part("old"), { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
      .to(
        part("old-dissolve"),
        {
          opacity: 0,
          scale: 0.55,
          filter: "blur(8px) brightness(2.2)",
          duration: 0.55,
          ease: "power3.in",
        },
        "dissolve",
      )
      .fromTo(
        part("outline"),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.1, ease: "power3.inOut" },
        "dissolve+=0.1",
      )
      .fromTo(part("fill"), { opacity: 0 }, { opacity: 1, duration: 0.45 }, "impact-=0.4")
      .to(
        part("flash"),
        {
          keyframes: [
            { opacity: 1, duration: 0.08, ease: "none" },
            { opacity: 0, duration: 0.62 },
          ],
        },
        "impact-=0.05",
      )
      .to(
        part("blason"),
        {
          keyframes: [
            { scale: 1.07, duration: 0.18 },
            { scale: 1, duration: 0.32, ease: "power1.inOut" },
          ],
        },
        "impact",
      )
      .fromTo(
        part("bloom"),
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "power3.out" },
        "impact",
      )
      .fromTo(
        part("halo"),
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 0.8 },
        "impact",
      )
      .fromTo(
        part("ring"),
        { opacity: 1, scale: 0.15 },
        { opacity: 0, scale: 1, duration: 1.1, ease: "power3.out", immediateRender: false },
        "impact",
      );

    // Each spark on its own flight, all from the Blason's centre.
    for (const [index, { x, y, delay, duration }] of TIER_UP_SPARKS.entries()) {
      timeline.fromTo(
        `${part("spark")}:nth-child(${index + 1})`,
        { x: 0, y: 0, scale: 1, opacity: 1 },
        { x, y, scale: 0, opacity: 0, duration, ease: "power3.out", immediateRender: false },
        `impact+=${delay}`,
      );
    }

    timeline
      .fromTo(part("kicker"), RISE, RISEN, "name-=0.1")
      .fromTo(
        part("letter"),
        { opacity: 0, y: 46, scale: 1.25, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.05,
        },
        "name",
      )
      .fromTo(part("route"), RISE, RISEN, "name+=0.5")
      .fromTo(part("continue"), RISE, RISEN, "name+=0.8");
  },
  idle: (timeline) => {
    timeline.to(
      part("breath"),
      { scale: 1.08, opacity: 0.75, duration: 1.5, ease: "sine.inOut", yoyo: true, repeat: -1 },
      "wait",
    );
  },
};

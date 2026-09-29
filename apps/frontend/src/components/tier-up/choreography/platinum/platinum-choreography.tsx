import {
  PLATINUM_MOTES,
  PLATINUM_PLUMES,
  PLATINUM_SPARKS,
} from "@/components/tier-up/choreography/platinum/platinum-lights";
import {
  ASSEMBLED_AT,
  PLATINUM_TRIANGLES,
} from "@/components/tier-up/choreography/platinum/platinum-triangles";
import { TierUpAssembledEmblem } from "@/components/tier-up/choreography/platinum/tier-up-assembled-emblem";
import { TierUpHexGrid } from "@/components/tier-up/choreography/platinum/tier-up-hex-grid";
import { TierUpLightLine } from "@/components/tier-up/choreography/platinum/tier-up-light-line";
import { TierUpMotes } from "@/components/tier-up/choreography/platinum/tier-up-motes";
import { TierUpPlatinumHalo } from "@/components/tier-up/choreography/platinum/tier-up-platinum-halo";
import { TierUpPlumes } from "@/components/tier-up/choreography/platinum/tier-up-plumes";
import type { Choreography } from "@/components/tier-up/choreography/tier-up-choreography";
import {
  ASCEND,
  EASE_IN_OUT,
  EASE_OUT,
  POP,
  RING,
  SHARD,
  STUD_POP,
  SWEEP,
  UNFURL,
} from "@/components/tier-up/choreography/tier-up-eases";
import {
  breathe,
  captionIn,
  DRAWN,
  flash,
  motesRise,
  popIn,
  RISE,
  RISEN,
  ringOut,
  shake,
  sparksOut,
  UNDRAWN,
} from "@/components/tier-up/choreography/tier-up-moves";
import { part } from "@/components/tier-up/choreography/tier-up-part";
import { PLATINUM_FAN } from "@/components/tier/sprite/tier-wing-fans";
import { TierUpGround } from "@/components/tier-up/parts/tier-up-ground";
import { TierUpOldEmblem } from "@/components/tier-up/parts/tier-up-old-emblem";
import { SHEEN } from "@/components/tier-up/parts/tier-up-sheen";
import { TierUpSparks } from "@/components/tier-up/parts/tier-up-sparks";
import { TierUpWhiteout } from "@/components/tier-up/parts/tier-up-whiteout";

type Timeline = gsap.core.Timeline;

// The screen shaking as the Platinum is assembled, over 0.45 s: through each x, y (px), dying down.
const SHAKE = [
  [-14, 9],
  [12, -11],
  [-9, -6],
  [8, 7],
  [-5, 4],
  [4, -3],
  [-2, 2],
] as const;

const SHAKE_S = 0.45;

// When the line of light flashes, and in how long: brightest and tallest at 30 % of it, then
// stretched thin as it fades.
const LINE_AT = 1.35;

const LINE_S = 0.6;

// When the first stud pops in, then seconds between two of them, around the hexagon.
const STUDS_AT = 2.5;

const STUD_STEP_S = 0.1;

// When the lowest feathers unfurl, then seconds between a feather and the one above it.
const FEATHERS_AT = 2.4;

const FEATHER_STEP_S = 0.06;

// How a feather starts to unfurl: turned back and tiny.
const FURLED = { "--turn": -12, "--grow": 0.12, opacity: 0 };

// When the wings start fluttering, and how far they flap (deg), every 3 s.
const FLUTTER_AT = 3.2;

const FLUTTER = { flap: -5, period: 3 } as const;

// How long a plume takes to rise, and at what share of it it is brightest.
const PLUME_S = 3.2;

const PLUME_PEAK = 0.35;

// The line of light, flashing up, then stretched thin as it fades.
const lineFlashes = (timeline: Timeline) =>
  timeline
    .fromTo(
      part("line"),
      { scaleX: 1, scaleY: 0, opacity: 0 },
      { scaleY: 1.2, opacity: 1, duration: LINE_S * 0.3, ease: EASE_OUT },
      LINE_AT,
    )
    .to(
      part("line"),
      { scaleX: 0.2, scaleY: 1.7, opacity: 0, duration: LINE_S * 0.7, ease: EASE_OUT },
      LINE_AT + LINE_S * 0.3,
    );

// Each triangle flying in from far off, turned flat and edge on, seen from 40 % of its flight:
// all meet at the impact.
const trianglesMeet = (timeline: Timeline) => {
  for (const [index, { x, y, rotation, rotationY, at }] of PLATINUM_TRIANGLES.entries()) {
    const triangle = `${part("triangle")}[data-index="${index}"]`;
    const duration = ASSEMBLED_AT - at;

    timeline
      .fromTo(
        triangle,
        { x, y, rotation, rotationY, transformPerspective: 900 },
        { x: 0, y: 0, rotation: 0, rotationY: 0, duration, ease: SHARD },
        at,
      )
      .fromTo(triangle, { opacity: 0 }, { opacity: 1, duration: duration * 0.4, ease: SHARD }, at);
  }
};

// Each feather of both wings unfurling from its root, the lowest first.
const wingsUnfurl = (timeline: Timeline) => {
  for (const [index, [turn, scale]] of PLATINUM_FAN.entries()) {
    const rank = PLATINUM_FAN.length - 1 - index;

    timeline.fromTo(
      `${part("feather")}:nth-child(${index + 1})`,
      FURLED,
      { "--turn": turn, "--grow": scale, opacity: 1, duration: 0.6, ease: UNFURL },
      FEATHERS_AT + rank * FEATHER_STEP_S,
    );
  }
};

// Gold → Platinum, as its artboard « 4 · Or → Platine » plays it, keyframe for keyframe, with its
// timings and its curves: the gold shield rises in, then turns over edge on, brighter, and is
// gone; a line of light splits the stage; the Platinum's six triangles fly in, turning, and are
// assembled in a blinding white, with the screen shaking, a flash along their seams and of its
// shape, the halo, the bloom and its full Aura lighting up, a grid of light spreading behind it,
// two rings and sparks; its studs pop in one by one with a ring each, its wings unfurl feather by
// feather, its star is traced, then cut, and a light sweeps over the metal; then the caption. As
// in the artboard, the beaded ring turns from the start, unseen until it fades in; the plumes and
// the motes rise from after the impact, the halo breathes from 3.1 s and the wings flutter from
// 3.2 s.
export const platinumChoreography: Choreography = {
  beats: { dissolve: 0.9, impact: ASSEMBLED_AT, name: 2.75, wait: 4.15 },
  sounds: {
    dissolve: "tier-up-platinum-flip",
    impact: "tier-up-platinum-assemble",
    name: "tier-up-platinum-name",
  },
  cues: [],
  title: { size: 124, leading: 1.02, tracking: 0.06, shadow: { y: 8, blur: 30, percent: 50 } },
  scene: ({ from, to }) => (
    <>
      <TierUpGround
        tier={to}
        bloom={{ reach: "42% 48%", percent: 30 }}
        ground={{ tint: "crease", percent: 22 }}
      />
      <TierUpHexGrid tier={to} />
      <TierUpPlumes tier={to} />
      <div data-tier-up="shake" className="absolute inset-0">
        <TierUpPlatinumHalo tier={to} />
        <TierUpSparks tier={to} sparks={PLATINUM_SPARKS} glow={12} />
        <TierUpOldEmblem tier={from} />
        <TierUpLightLine tier={to} />
        <TierUpAssembledEmblem tier={to} />
      </div>
      <TierUpWhiteout tier={to} />
      <TierUpMotes tier={to} motes={PLATINUM_MOTES} />
    </>
  ),
  intro: (timeline) => {
    timeline
      .fromTo(part("ground"), { opacity: 0 }, { opacity: 1, duration: 1, ease: EASE_OUT }, 0)
      .fromTo(part("old"), RISE, { ...RISEN, duration: 0.6 }, 0.1)
      // The gold turning over edge on, brighter, then gone at once.
      .fromTo(
        part("old-dissolve"),
        { rotationY: 0, transformPerspective: 800, filter: "brightness(1)" },
        { rotationY: 90, filter: "brightness(2.4)", duration: 0.5, ease: ASCEND },
        "dissolve",
      )
      .fromTo(part("old-dissolve"), { opacity: 1 }, { opacity: 0, duration: 0.05 }, 1.4);

    lineFlashes(timeline);
    trianglesMeet(timeline);
    flash(timeline, part("flash"), 0.7, 2.28);
    flash(timeline, part("whiteout"), 0.8, 2.28, 0.1);
    flash(timeline, part("seams"), 0.6, "impact");
    shake(timeline, SHAKE, SHAKE_S, "impact")
      .fromTo(part("body"), { opacity: 0 }, { opacity: 1, duration: 0.15 }, "impact")
      .to(
        part("emblem"),
        {
          keyframes: [
            { scale: 1.09, duration: 0.175, ease: EASE_OUT },
            { scale: 1, duration: 0.325, ease: EASE_OUT },
          ],
        },
        "impact",
      )
      .fromTo(part("aura"), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: EASE_OUT }, "impact")
      .fromTo(
        part("bloom"),
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 1.4, ease: POP },
        "impact",
      )
      .fromTo(
        part("grid"),
        { opacity: 0, scale: 0.45 },
        { opacity: 1, scale: 1, duration: 1.6, ease: POP },
        "impact",
      )
      .fromTo(
        part("halo"),
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 0.8, ease: EASE_OUT },
        "impact",
      )
      .fromTo(part("orbit"), { opacity: 0 }, { opacity: 1, duration: 1, ease: EASE_OUT }, 2.7);

    ringOut(timeline, "ring", { at: "impact", duration: 1, ease: RING });
    ringOut(timeline, "ring-wide", { at: 2.45, duration: 1.3, ease: RING });
    sparksOut(timeline, PLATINUM_SPARKS);

    // Each stud pops in, its ring flying off it, one by one around the hexagon: small and lit
    // until then, as in the canvas.
    popIn(timeline, `${part("engraving")} > circle`, {
      at: STUDS_AT,
      duration: 0.3,
      peak: 1.35,
      ease: STUD_POP,
      stagger: STUD_STEP_S,
    });
    timeline.fromTo(
      `${part("pings")} > circle`,
      { "--ping": 0.3, opacity: 1 },
      {
        "--ping": 3.2,
        opacity: 0,
        duration: 0.5,
        ease: EASE_OUT,
        stagger: STUD_STEP_S,
      },
      STUDS_AT,
    );
    wingsUnfurl(timeline);

    timeline
      .fromTo(
        part("star-trace"),
        { attr: UNDRAWN },
        { attr: DRAWN, duration: 0.45, ease: EASE_IN_OUT },
        3.05,
      )
      .fromTo(
        // The star as a whole: its layers keep their own opacity.
        `${part("engraving")} > g`,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: EASE_OUT },
        3.4,
      )
      // As an attribute, in the grid's units: GSAP never parses an SVG transform.
      .fromTo(
        part("sheen"),
        { attr: { x: SHEEN.x } },
        { attr: { x: SHEEN.x + SHEEN.sweep }, duration: 0.9, ease: SWEEP },
        3.6,
      );

    captionIn(timeline, {
      kicker: 2.65,
      route: 3.35,
      proceed: 3.65,
      letters: { duration: 0.55, stagger: 0.05, scale: 1.3 },
    });
  },
  idle: (timeline) => {
    breathe(timeline, 3.1, 2.8);
    timeline
      .fromTo(
        `${part("orbit")} > div`,
        { rotation: 0 },
        { rotation: 360, duration: 9, ease: "none", repeat: -1 },
        0,
      )
      .to(
        part("wing"),
        {
          keyframes: [
            { "--flap": FLUTTER.flap, duration: FLUTTER.period / 2, ease: EASE_IN_OUT },
            { "--flap": 0, duration: FLUTTER.period / 2, ease: EASE_IN_OUT },
          ],
          repeat: -1,
        },
        FLUTTER_AT,
      );

    // Each plume rising and swelling, then gone, again and again.
    for (const [index, { at }] of PLATINUM_PLUMES.entries()) {
      const plume = `${part("plume")}[data-index="${index}"]`;

      timeline
        .fromTo(
          plume,
          { y: 90, scaleY: 0.7 },
          { y: -170, scaleY: 1.2, duration: PLUME_S, ease: EASE_OUT, repeat: -1 },
          at,
        )
        .fromTo(
          plume,
          { opacity: 0 },
          {
            keyframes: [
              { opacity: 1, duration: PLUME_S * PLUME_PEAK, ease: EASE_OUT },
              { opacity: 0, duration: PLUME_S * (1 - PLUME_PEAK), ease: EASE_OUT },
            ],
            repeat: -1,
          },
          at,
        );
    }

    // Each mote rising and drifting, lit by 15 % of its rise, dimmed by 80 %, again and again.
    motesRise(timeline, "mote", PLATINUM_MOTES, { lit: 0.15, dimmed: 0.8 });
  },
};

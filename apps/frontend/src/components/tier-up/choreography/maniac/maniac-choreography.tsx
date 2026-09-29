import { DIAMOND_FACETS } from "@/components/tier-up/choreography/diamond/diamond-facets";
import { MANIAC_CRACKS } from "@/components/tier-up/choreography/maniac/maniac-cracks";
import {
  MANIAC_EARLY_EMBERS,
  MANIAC_GUST_SPARKS,
  MANIAC_LATE_EMBERS,
  MANIAC_SHED,
  MANIAC_SPARKS,
  MANIAC_SWIRL,
} from "@/components/tier-up/choreography/maniac/maniac-lights";
import { FIRE, MANIAC_PAINT } from "@/components/tier-up/choreography/maniac/maniac-paint";
import { TierUpBlaze } from "@/components/tier-up/choreography/maniac/tier-up-blaze";
import { TierUpEmbers } from "@/components/tier-up/choreography/maniac/tier-up-embers";
import { TierUpHeat } from "@/components/tier-up/choreography/maniac/tier-up-heat";
import { TierUpHush } from "@/components/tier-up/choreography/maniac/tier-up-hush";
import { TierUpIgnitedEmblem } from "@/components/tier-up/choreography/maniac/tier-up-ignited-emblem";
import { TierUpManiacHalo } from "@/components/tier-up/choreography/maniac/tier-up-maniac-halo";
import { TierUpManiacRings } from "@/components/tier-up/choreography/maniac/tier-up-maniac-rings";
import { TierUpManiacRays } from "@/components/tier-up/choreography/maniac/tier-up-maniac-rays";
import { TierUpMeltingGem } from "@/components/tier-up/choreography/maniac/tier-up-melting-gem";
import { TierUpShed } from "@/components/tier-up/choreography/maniac/tier-up-shed";
import { TierUpVortex } from "@/components/tier-up/choreography/maniac/tier-up-vortex";
import type { Choreography } from "@/components/tier-up/choreography/tier-up-choreography";
import {
  BEAT_RAISE,
  BEAT_REST,
  BEAT_SWEEP,
  DROP,
  EASE_IN,
  EASE_IN_OUT,
  EASE_OUT,
  FLING,
  GUST,
  IGNITE,
  LAND,
  LETTER_SLAM,
  POP,
  RING,
  SPARK,
  SPREAD_OUT,
  SPREAD_ROUND,
  STUD_POP,
  VORTEX,
} from "@/components/tier-up/choreography/tier-up-eases";
import {
  breathe,
  captionLinesIn,
  motesRise,
  DRAWN,
  popIn,
  ringOut,
  shakeThrough,
  sparksOut,
  UNDRAWN,
} from "@/components/tier-up/choreography/tier-up-moves";
import { part } from "@/components/tier-up/choreography/tier-up-part";
import { TierUpGround } from "@/components/tier-up/parts/tier-up-ground";
import { TierUpSparks } from "@/components/tier-up/parts/tier-up-sparks";
import { METALS } from "@/components/tier/sprite/tier-sprite-paint";
import { MANIAC_FANS } from "@/components/tier/sprite/tier-wing-fans";

type Timeline = gsap.core.Timeline;

// The crown's gems of fire and its flame, as its engraving holds them: its circles, then its last
// group.
const GEMS_OF_FIRE = `${part("engraving")} > circle`;

const CROWN_FLAME = `${part("engraving")} > g:last-child`;

// When the gem breaks into the vortex, when the crown lands after the silence, and when it catches
// fire (a label of its own: the gusts of embers burst out from it).
const BREAK = 2.1;

const IMPACT = 3.8;

const BLAZE = 6.9;

// The three times the screen shakes, each through x, y (px) and a turn (deg) at its share of it,
// dying down, then still again: as the gem breaks, as the crown lands (a quake, dropping it first,
// turning it), as it catches fire.
const BREAK_SHAKE = {
  at: BREAK,
  duration: 0.3,
  steps: [
    [0.1, -10, 6],
    [0.25, 9, -7],
    [0.4, -6, -4],
    [0.55, 5, 4],
    [0.7, -3, 2],
    [0.85, 2, -1],
  ],
} as const;

const QUAKE = {
  at: IMPACT,
  duration: 0.8,
  steps: [
    [0.06, 0, 26],
    [0.14, -22, -14, -0.5],
    [0.24, 20, 12, 0.5],
    [0.34, -15, -8],
    [0.46, 12, 7],
    [0.58, -8, -4],
    [0.72, 5, 3],
    [0.86, -2, -1],
  ],
} as const;

const BLAZE_SHAKE = { ...BREAK_SHAKE, at: BLAZE, duration: 0.6 };

// The old gem trembling from 0.8 s until it breaks: through each x, y (px), 0.1 s each time.
const TREMBLE = {
  at: 0.8,
  period: 0.1,
  times: 13,
  steps: [
    [-3, 2],
    [3, -2],
    [-2, -3],
    [0, 0],
  ],
};

// The silence, from 2.75 s, for 1.4 s: dark at 45 % of it, clearing from 75 %.
const HUSH = { at: 2.75, duration: 1.4, dark: 0.45, clearing: 0.75 } as const;

// The heart of the vortex, from 2.2 s, for 1.6 s: whole at 15 % of it, then growing to 3.2 times
// its size by 88 %, then gone as the crown drops.
const CORE = { at: 2.2, duration: 1.6, lit: 0.15, grown: 0.88, size: 3.2 } as const;

// When the gems of the band light, then those on the outer points; the flame catching after them.
const GEMS = { at: 4.15, step: 0.2, points: 4.75, flame: 4.95 } as const;

// When each fan of the wings starts to spread (the topmost feather first), seconds between a
// feather and the one below it, and how long each takes; the same as the feathers sway.
const SPREAD = { deep: 5, hot: 5.32, step: 0.07, duration: 1.7, out: 0.22 } as const;

const SWAY = { deep: 7.6, hot: 7.78, step: 0.12, period: 2.4, turn: 4 } as const;

// How a feather starts to spread: turned back and tiny.
const FURLED = { "--turn": -38, "--grow": 0, opacity: 0 };

// The wings beating once (deg, at each share of 1 s), then fluttering every 2.4 s.
const BEAT = { at: 6.4, raised: 14, swept: -17 } as const;

const FLUTTER = { at: 7.6, flap: -4, period: 2.4 } as const;

// The fire of each wing's front feathers glowing out of step, every 1.4 s.
const WING_GLOW = { left: 7.3, right: 7.5, period: 1.4 } as const;

// When each of the embers by the wings pops in.
const WING_EMBERS = [6.95, 7, 7.05] as const;

// The flame over the crown flickering every 0.45 s: stretched (x, y) and licking sideways (deg).
const FLICKER = {
  at: 5.55,
  period: 0.45,
  steps: [
    [1.03, 1.09, 3],
    [0.97, 0.94, -3],
    [1.02, 1.05, 1.5],
    [1, 1, 0],
  ],
} as const;

// A glow flickering down to 0.55 and back, every `period` s, from `at`.
const flicker = (timeline: Timeline, target: string, at: number, period: number) =>
  timeline.to(
    target,
    {
      keyframes: [
        { opacity: 0.55, duration: period / 2, ease: EASE_IN_OUT },
        { opacity: 1, duration: period / 2, ease: EASE_IN_OUT },
      ],
      repeat: -1,
    },
    at,
  );

// The old gem coming in, heating up, trembling and cracking, then flung apart into the vortex:
// its dark shape and its cracks gone at once, its facets flying off in depth.
const gemBreaks = (timeline: Timeline) => {
  timeline
    .fromTo(part("old"), { opacity: 0 }, { opacity: 1, duration: 0.6, ease: EASE_OUT }, 0.1)
    .fromTo(
      part("old-heat"),
      { filter: MANIAC_PAINT.cold },
      { filter: MANIAC_PAINT.hot, duration: 1.6, ease: EASE_IN },
      0.5,
    )
    .to(
      part("old-tremble"),
      {
        keyframes: TREMBLE.steps.map(([x, y]) => ({
          x,
          y,
          duration: TREMBLE.period / TREMBLE.steps.length,
        })),
        repeat: TREMBLE.times - 1,
      },
      TREMBLE.at,
    )
    .fromTo(
      `${part("gem")}, ${part("cracks")}`,
      { opacity: 1 },
      { opacity: 0, duration: 0.05 },
      BREAK,
    );

  for (const [index, { at, duration }] of MANIAC_CRACKS.entries()) {
    timeline.fromTo(
      `${part("crack")}[data-index="${index}"]`,
      { attr: UNDRAWN },
      { attr: DRAWN, duration, ease: EASE_IN },
      at,
    );
  }

  for (const [index, { x, y, z, rotationX, rotationY }] of DIAMOND_FACETS.entries()) {
    timeline.fromTo(
      `${part("gem-facet")}[data-index="${index}"]`,
      { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, opacity: 1, transformPerspective: 900 },
      { x, y, z, rotationX, rotationY, opacity: 0, duration: 1.1, ease: FLING },
      "dissolve",
    );
  }
};

// The vortex: a ring flying off the breaking gem, the embers swirling in, each turning with its
// line as it closes in, and the heart they feed; then the silence, the stage holding its breath.
const vortexTurns = (timeline: Timeline) => {
  ringOut(timeline, "ring", { at: BREAK, duration: 0.9, ease: RING });

  for (const [index, { angle, reach, delay, duration }] of MANIAC_SWIRL.entries()) {
    const turn = `${part("swirl-turn")}[data-index="${index}"]`;
    const mote = `${turn} > ${part("swirl")}`;

    timeline
      .fromTo(turn, { rotation: angle }, { rotation: angle + 280, duration, ease: VORTEX }, delay)
      .fromTo(mote, { x: reach, scale: 1 }, { x: 0, scale: 0.3, duration, ease: VORTEX }, delay)
      .fromTo(
        mote,
        { opacity: 0 },
        {
          keyframes: [
            { opacity: 1, duration: duration * 0.2, ease: VORTEX },
            { opacity: 0, duration: duration * 0.8, ease: VORTEX },
          ],
        },
        delay,
      );
  }

  timeline
    .fromTo(
      part("core"),
      { scale: 0, opacity: 0 },
      {
        keyframes: [
          { scale: 1, opacity: 1, duration: CORE.duration * CORE.lit },
          { scale: CORE.size, duration: CORE.duration * (CORE.grown - CORE.lit) },
          { scale: 0, opacity: 0, duration: CORE.duration * (1 - CORE.grown) },
        ],
      },
      CORE.at,
    )
    .fromTo(
      part("hush"),
      { opacity: 0 },
      {
        keyframes: [
          { opacity: 1, duration: HUSH.duration * HUSH.dark, ease: EASE_IN_OUT },
          { opacity: 1, duration: HUSH.duration * (HUSH.clearing - HUSH.dark) },
          { opacity: 0, duration: HUSH.duration * (1 - HUSH.clearing), ease: EASE_IN_OUT },
        ],
      },
      HUSH.at,
    );
};

// The crown dropping from above, landing squashed then whole in its halo, with the rings of the
// quake and its sparks over the floor; its gems lighting one by one, a ring of fire flying off
// each of the three in its band, then its flame catching.
const crownLands = (timeline: Timeline) => {
  timeline
    .fromTo(
      part("drop"),
      { y: -640, scale: 1.3 },
      { y: 0, scale: 1, duration: 0.6, ease: DROP },
      3.2,
    )
    .fromTo(part("drop"), { opacity: 0 }, { opacity: 1, duration: 0.09, ease: DROP }, 3.2)
    .to(
      part("emblem"),
      {
        keyframes: [
          { scaleX: 1.16, scaleY: 0.84, duration: 0.112, ease: LAND },
          { scaleX: 0.95, scaleY: 1.06, duration: 0.208, ease: LAND },
          { scaleX: 1.02, scaleY: 0.98, duration: 0.24, ease: LAND },
          { scaleX: 1, scaleY: 1, duration: 0.24, ease: LAND },
        ],
      },
      "impact",
    )
    .fromTo(
      part("halo"),
      { opacity: 0, scale: 0.3 },
      { opacity: 1, scale: 1, duration: 1.2, ease: EASE_OUT },
      "impact",
    );

  shakeThrough(timeline, BREAK_SHAKE.steps, BREAK_SHAKE.duration, BREAK_SHAKE.at);
  shakeThrough(timeline, QUAKE.steps, QUAKE.duration, QUAKE.at);
  ringOut(timeline, "floor", { at: "impact", duration: 1.1, ease: RING });
  ringOut(timeline, "floor-wide", { at: 3.9, duration: 1.5, ease: RING });
  ringOut(timeline, "ring-wide", { at: "impact", duration: 1.2, ease: RING });
  sparksOut(timeline, MANIAC_SPARKS);

  popIn(timeline, `${GEMS_OF_FIRE}:nth-of-type(-n+3)`, {
    at: GEMS.at,
    duration: 0.4,
    peak: 1.5,
    ease: STUD_POP,
    stagger: GEMS.step,
  });
  popIn(timeline, `${GEMS_OF_FIRE}:nth-of-type(n+4)`, {
    at: GEMS.points,
    duration: 0.4,
    peak: 1.5,
    ease: STUD_POP,
  });

  timeline
    .fromTo(
      `${part("pings")} > circle`,
      { "--ping": 0.3, opacity: 0.9 },
      { "--ping": 3.4, opacity: 0, duration: 0.6, ease: EASE_OUT, stagger: GEMS.step },
      GEMS.at,
    )
    .fromTo(
      CROWN_FLAME,
      { "--flare-x": 0.4, "--flare-y": 0, opacity: 0 },
      {
        keyframes: [
          { "--flare-x": 1.05, "--flare-y": 1.3, opacity: 1, duration: 0.36, ease: IGNITE },
          { "--flare-x": 1, "--flare-y": 1, duration: 0.24, ease: IGNITE },
        ],
      },
      GEMS.flame,
    );
};

// Each feather of both wings spreading from its root, the topmost of each fan first: shooting
// out, then swept round into place; then both wings beating once, shedding sparks, and the embers
// by them popping in.
const wingsSpread = (timeline: Timeline) => {
  for (const fan of ["deep", "hot"] as const) {
    const feathers = MANIAC_FANS[fan];

    for (const [index, [turn, scale]] of feathers.entries()) {
      const rank = feathers.length - 1 - index;

      timeline.fromTo(
        `${part("feather")}[data-fan="${fan}"][data-index="${index}"]`,
        FURLED,
        {
          keyframes: [
            {
              "--grow": scale * 0.7,
              opacity: 1,
              duration: SPREAD.duration * SPREAD.out,
              ease: SPREAD_OUT,
            },
            {
              "--turn": turn,
              "--grow": scale,
              duration: SPREAD.duration * (1 - SPREAD.out),
              ease: SPREAD_ROUND,
            },
          ],
        },
        SPREAD[fan] + rank * SPREAD.step,
      );
    }
  }

  timeline.to(
    part("wing"),
    {
      keyframes: [
        { "--flap": BEAT.raised, duration: 0.32, ease: BEAT_RAISE },
        { "--flap": BEAT.swept, duration: 0.2, ease: BEAT_SWEEP },
        { "--flap": 0, duration: 0.48, ease: BEAT_REST },
      ],
    },
    BEAT.at,
  );

  for (const [index, { x, y, delay, duration }] of MANIAC_SHED.entries()) {
    timeline.fromTo(
      `${part("shed")}:nth-child(${index + 1})`,
      { x: 0, y: 0, scale: 1, opacity: 1 },
      { x, y, scale: 0, opacity: 0, duration, ease: SPARK, immediateRender: false },
      delay,
    );
  }

  for (const [index, at] of WING_EMBERS.entries()) {
    popIn(timeline, `${part("wing-ember")}[data-index="${index}"]`, {
      at,
      duration: 0.35,
      peak: 1.5,
      ease: STUD_POP,
    });
  }
};

// The crown catching fire: the light opening behind it, its rays fading in, the screen shaking, the
// crown swelling, two gusts of fire and a burst of embers blown out, the fire spreading along the
// window's edges, and its full Aura lighting up from behind.
const crownCatches = (timeline: Timeline) => {
  timeline
    .addLabel("blaze", BLAZE)
    .fromTo(
      part("bloom"),
      { opacity: 0, scale: 0.3 },
      { opacity: 1, scale: 1, duration: 2.2, ease: POP },
      6.85,
    )
    .fromTo(part("rays"), { opacity: 0 }, { opacity: 1, duration: 1.8, ease: EASE_OUT }, 6.85)
    .fromTo(part("rays-back"), { opacity: 0 }, { opacity: 1, duration: 1.8, ease: EASE_OUT }, 7.1)
    .to(
      part("swell"),
      {
        keyframes: [
          { scale: 1.06, duration: 0.36, ease: EASE_OUT },
          { scale: 1, duration: 0.54, ease: EASE_OUT },
        ],
      },
      "blaze",
    )
    .fromTo(
      part("gust"),
      { opacity: 0.9, scale: 0.2 },
      { opacity: 0, scale: 1, duration: 1.7, ease: GUST },
      "blaze",
    )
    .fromTo(
      part("gust-wide"),
      { opacity: 0.9, scale: 0.2 },
      { opacity: 0, scale: 1, duration: 2, ease: GUST },
      6.95,
    )
    .fromTo(part("blaze"), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: EASE_OUT }, "blaze")
    .fromTo(part("aura"), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: EASE_OUT }, "blaze");

  shakeThrough(timeline, BLAZE_SHAKE.steps, BLAZE_SHAKE.duration, BLAZE_SHAKE.at);
  sparksOut(timeline, MANIAC_GUST_SPARKS, { name: "gust-spark", from: "blaze" });
};

// Each letter of the name slammed down on its own, out of a blur, one every 0.1 s.
const lettersSlam = (timeline: Timeline) =>
  timeline.fromTo(
    part("letter"),
    { opacity: 0, y: -70, scale: 1.5, filter: "blur(8px)" },
    {
      keyframes: [
        { opacity: 1, y: 6, scale: 0.97, filter: "blur(0px)", duration: 0.36, ease: LETTER_SLAM },
        { y: 0, scale: 1, duration: 0.24, ease: LETTER_SLAM },
      ],
      stagger: 0.1,
    },
    "name",
  );

// Each ember lit by 12 % of its rise, dimmed by 80 %, shrinking to 0.4 as it goes up.
const EMBER_GLOW = { lit: 0.12, dimmed: 0.8, shrink: 0.4 } as const;

// Each feather of both wings swaying on its own, the topmost of each fan first.
const feathersSway = (timeline: Timeline) => {
  for (const fan of ["deep", "hot"] as const) {
    const feathers = MANIAC_FANS[fan];

    for (const index of feathers.keys()) {
      const rank = feathers.length - 1 - index;

      timeline.to(
        `${part("feather")}[data-fan="${fan}"][data-index="${index}"]`,
        {
          keyframes: [
            { "--sway": SWAY.turn, duration: SWAY.period / 2, ease: EASE_IN_OUT },
            { "--sway": 0, duration: SWAY.period / 2, ease: EASE_IN_OUT },
          ],
          repeat: -1,
        },
        SWAY[fan] + rank * SWAY.step,
      );
    }
  }
};

// Diamond → Maniac, as its artboard « 6 · Diamant → Maniac » plays it, keyframe for keyframe,
// with its timings and its curves: the heat rises and the Diamond's gem trembles, heating up while
// cracks of white heat run through it; it breaks, its facets flung into a vortex of embers around
// a heart that grows; the silence, the stage holding its breath; the Maniac's crown drops and lands
// with a quake and three rings, its gems light and its flame catches, its wings spread feather by
// feather and beat once, shedding sparks; then it catches fire, with a shake, two gusts of fire and
// a burst of embers, the fire spreading along the window's edges and its full Aura lighting up;
// then « Palier ultime », its name letter by letter, the route and « Continuer ». As in the
// artboard, the two wheels of rays turn against each other from the start, unseen until they fade
// in; embers rise from the start, more once it has caught fire; the heat flickers from 2.3 s, the
// flame from 5.55 s; the halo breathes, the wings flutter and sway, their fire glows and the fire
// along the edges flickers once it is ablaze.
export const maniacChoreography: Choreography = {
  beats: { dissolve: BREAK, impact: IMPACT, name: 7.15, wait: 9 },
  sounds: {
    dissolve: "tier-up-maniac-vortex",
    impact: "tier-up-maniac-quake",
    name: "tier-up-maniac-name",
  },
  cues: [
    { sound: "tier-up-maniac-heat", at: 0.5 },
    { sound: "tier-up-maniac-hush", at: HUSH.at },
    { sound: "tier-up-maniac-ignite", at: BLAZE },
  ],
  title: {
    size: 144,
    leading: 1,
    tracking: 0.07,
    shadow: { y: 10, blur: 40, percent: 45 },
    letters: MANIAC_PAINT.letters,
    glow: MANIAC_PAINT.nameGlow,
    kicker: METALS.maniac.light,
  },
  scene: ({ from, to }) => (
    <>
      <TierUpGround
        tier={to}
        ground={{ tint: "mid", percent: 6 }}
        bloom={{ reach: "60% 64%", percent: 40 }}
      />
      <TierUpHeat />
      <TierUpEmbers name="early-ember" embers={MANIAC_EARLY_EMBERS} />
      <TierUpHush />
      <div data-tier-up="shake" className="absolute inset-0">
        <TierUpManiacRays />
        <TierUpManiacHalo tier={to} />
        <TierUpVortex />
        <TierUpManiacRings tier={to} />
        <TierUpSparks
          tier={to}
          sparks={MANIAC_SPARKS}
          glow={12}
          light={{ color: FIRE.spark, halo: METALS.maniac.mid }}
        />
        <TierUpShed />
        <TierUpSparks
          tier={to}
          sparks={MANIAC_GUST_SPARKS}
          glow={14}
          name="gust-spark"
          light={{ color: FIRE.ember, halo: FIRE.red }}
        />
        <TierUpMeltingGem tier={from} />
        <TierUpIgnitedEmblem tier={to} />
      </div>
      <TierUpBlaze />
      <TierUpEmbers name="late-ember" embers={MANIAC_LATE_EMBERS} />
    </>
  ),
  intro: (timeline) => {
    timeline
      .fromTo(part("ground"), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: EASE_OUT }, 0)
      .fromTo(part("heat"), { opacity: 0 }, { opacity: 1, duration: 2, ease: EASE_OUT }, 0.3);

    gemBreaks(timeline);
    vortexTurns(timeline);
    crownLands(timeline);
    wingsSpread(timeline);
    crownCatches(timeline);
    lettersSlam(timeline);
    captionLinesIn(timeline, { kicker: 7.05, route: 8.1, proceed: 8.4, rise: 0.6 });
  },
  idle: (timeline) => {
    motesRise(timeline, "early-ember", MANIAC_EARLY_EMBERS, EMBER_GLOW);
    motesRise(timeline, "late-ember", MANIAC_LATE_EMBERS, EMBER_GLOW);
    flicker(timeline, part("heat-flicker"), 2.3, 1.8);
    breathe(timeline, 7.4, 2.4, { scale: 1.1, opacity: 0.7 });
    feathersSway(timeline);
    flicker(
      timeline,
      `${part("hot-feathers")}[data-side="left"]`,
      WING_GLOW.left,
      WING_GLOW.period,
    );
    flicker(
      timeline,
      `${part("hot-feathers")}[data-side="right"]`,
      WING_GLOW.right,
      WING_GLOW.period,
    );
    flicker(timeline, part("blaze-flicker"), 8.2, 1.6);

    timeline
      .fromTo(
        `${part("rays")} > div`,
        { rotation: 0 },
        { rotation: 360, duration: 28, ease: "none", repeat: -1 },
        0,
      )
      .fromTo(
        `${part("rays-back")} > div`,
        { rotation: 0 },
        { rotation: -360, duration: 18, ease: "none", repeat: -1 },
        0,
      )
      .to(
        CROWN_FLAME,
        {
          keyframes: FLICKER.steps.map(([x, y, lick]) => ({
            "--flare-x": x,
            "--flare-y": y,
            "--lick": lick,
            duration: FLICKER.period / FLICKER.steps.length,
            ease: EASE_IN_OUT,
          })),
          repeat: -1,
        },
        FLICKER.at,
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
        FLUTTER.at,
      );
  },
};

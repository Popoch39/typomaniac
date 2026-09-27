import type { Tier } from "ranked";
import type { ReactNode } from "react";

import type { TierUpSound } from "@/audio/face-off-sounds";
import { argentChoreography } from "@/components/tier-up/choreography/argent/argent-choreography";
import { bronzeChoreography } from "@/components/tier-up/choreography/bronze/bronze-choreography";
import { diamantChoreography } from "@/components/tier-up/choreography/diamant/diamant-choreography";
import { maniacChoreography } from "@/components/tier-up/choreography/maniac/maniac-choreography";
import { orChoreography } from "@/components/tier-up/choreography/or/or-choreography";
import { platineChoreography } from "@/components/tier-up/choreography/platine/platine-choreography";
import type { NameShadow } from "@/components/tier-up/parts/tier-up-paint";

// The highlights every Tier-up's timeline carries, as labels: the old Emblem coming apart, the new
// Blason's impact, the Tier's name, then the wait, from which the Blason lives on until closed.
export const TIER_UP_BEATS = ["dissolve", "impact", "name", "wait"] as const;

export type TierUpBeat = (typeof TIER_UP_BEATS)[number];

// The highlights with a sound.
export type SoundBeat = Exclude<TierUpBeat, "wait">;

export const SOUND_BEATS: readonly SoundBeat[] = ["dissolve", "impact", "name"];

// The Tier left and the Tier reached, whose drawings and colours a scene is made of.
export type SceneTiers = { from: Tier; to: Tier };

// How a Tier-up plays, from its artboard in the canvas: when each highlight comes (s), the sound
// of each, what its stage draws under the caption (the ground, the old Emblem, the new one and
// their lights), the intro up to the wait, and the loops that go on until it is closed, from
// where the artboard starts them (left out under reduced motion). Both build onto the timeline
// whose labels are already placed, with the parts' selectors (the timeline is built inside the
// stage's GSAP context).
export type Choreography = {
  beats: Record<TierUpBeat, number>;
  sounds: Record<SoundBeat, TierUpSound>;
  // The sounds it cues between its highlights, each at its time (s): placed in the timeline too,
  // so that they are skipped with it, and never heard under reduced motion.
  cues: readonly { sound: TierUpSound; at: number }[];
  scene: (tiers: SceneTiers) => ReactNode;
  intro: (timeline: gsap.core.Timeline) => void;
  idle: (timeline: gsap.core.Timeline) => void;
  // How its artboard sets the name, when not as usual.
  title?: NameLook;
};

// How the name is set under the Blason: its size (px), its line height and letter spacing (em),
// the light under it, and the colours of the two ghosts of it its artboard leaves on either side
// as it comes in, if any. Its letters are in the metal of the Emblem, and nothing glows around
// them but the light under them, unless its artboard paints them (`letters`, a CSS gradient) or
// sets them glowing (`glow`, a CSS `drop-shadow()`) otherwise. The kicker over it and the arrow of
// the route under it are muted, unless its artboard lights them (`kicker`, a colour).
export type NameLook = {
  size: number;
  leading: number;
  tracking: number;
  shadow: NameShadow;
  ghosts?: { left: string; right: string };
  letters?: string;
  glow?: string;
  kicker?: string;
};

export const NAME_LOOK: NameLook = {
  size: 124,
  leading: 1.02,
  tracking: 0.06,
  shadow: { y: 6, blur: 24, percent: 45 },
};

// Each Tier's choreography, by the Tier reached, as each gets its own.
const CHOREOGRAPHIES: Partial<Record<Tier, Choreography>> = {
  bronze: bronzeChoreography,
  argent: argentChoreography,
  or: orChoreography,
  platine: platineChoreography,
  diamant: diamantChoreography,
  maniac: maniacChoreography,
};

// Until a Tier has its own, it plays Bronze's, with its own drawing and colours.
export const choreographyOf = (tier: Tier) => CHOREOGRAPHIES[tier] ?? bronzeChoreography;

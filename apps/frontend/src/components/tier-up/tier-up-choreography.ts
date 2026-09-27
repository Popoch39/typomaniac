import type { Tier } from "ranked";

import type { TierUpSound } from "@/audio/face-off-sounds";
import { bronzeChoreography } from "@/components/tier-up/bronze-choreography";

// The highlights every Tier-up's timeline carries, as labels: the old Emblem coming apart, the new
// Blason's impact, the Tier's name, then the wait, from which the Blason lives on until closed.
export const TIER_UP_BEATS = ["dissolve", "impact", "name", "wait"] as const;

export type TierUpBeat = (typeof TIER_UP_BEATS)[number];

// The highlights with a sound.
export type SoundBeat = Exclude<TierUpBeat, "wait">;

export const SOUND_BEATS: readonly SoundBeat[] = ["dissolve", "impact", "name"];

// How a Tier-up plays, from its artboard in the canvas: when each highlight comes (s), the sound
// of each, the intro up to the wait, and the loops from the wait on. Both build onto the timeline
// whose labels are already placed, with the parts' selectors (the timeline is built inside the
// stage's GSAP context).
export type Choreography = {
  beats: Record<TierUpBeat, number>;
  sounds: Record<SoundBeat, TierUpSound>;
  intro: (timeline: gsap.core.Timeline) => void;
  idle: (timeline: gsap.core.Timeline) => void;
};

// Each Tier's choreography, by the Tier reached, as each gets its own.
const CHOREOGRAPHIES: Partial<Record<Tier, Choreography>> = { bronze: bronzeChoreography };

// Until a Tier has its own, it plays Bronze's, with its own drawing and colours.
export const choreographyOf = (tier: Tier) => CHOREOGRAPHIES[tier] ?? bronzeChoreography;

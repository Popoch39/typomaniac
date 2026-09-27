import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

// The curves of the canvas's keyframes, exactly: its CSS `cubic-bezier()`s, named after what
// they move there.

// CSS `ease-out` and `ease-in-out`.
export const EASE_OUT = CustomEase.create("tier-up-ease-out", "0,0,0.58,1");

export const EASE_IN_OUT = CustomEase.create("tier-up-ease-in-out", "0.42,0,0.58,1");

// The old Emblem falling into light, faster and faster.
export const DISSOLVE = CustomEase.create("tier-up-dissolve", "0.6,0,0.9,0.4");

// The outline tracing itself: slow to start, then all at once.
export const DRAW = CustomEase.create("tier-up-draw", "0.6,0,0.3,1");

// The bloom and the letters popping in, fast, then settling.
export const POP = CustomEase.create("tier-up-pop", "0.2,0.8,0.2,1");

export const RING = CustomEase.create("tier-up-ring", "0.1,0.7,0.3,1");

export const SPARK = CustomEase.create("tier-up-spark", "0.12,0.7,0.3,1");

// The old Emblem's halves falling apart.
export const SPLIT = CustomEase.create("tier-up-split", "0.3,0,0.7,1");

// The shards of the new Emblem flying in, faster and faster, until they meet.
export const SHARD = CustomEase.create("tier-up-shard", "0.5,0,0.75,0");

// A chevron stamped in the metal, overshooting before it settles.
export const STAMP = CustomEase.create("tier-up-stamp", "0.5,0,0.6,1.4");

// The light sweeping over the metal.
export const SWEEP = CustomEase.create("tier-up-sweep", "0.4,0,0.2,1");

// The old Emblem rising into the column of light, faster and faster.
export const ASCEND = CustomEase.create("tier-up-ascend", "0.6,0,0.9,0.5");

// The column of light opening, then closing.
export const COLUMN = CustomEase.create("tier-up-column", "0.3,0,0.2,1");

// A leaf or a stud popping in, overshooting before it settles.
export const POP_OVER = CustomEase.create("tier-up-pop-over", "0.3,1.5,0.5,1");

// A stud of the Platine popping in, overshooting further.
export const STUD_POP = CustomEase.create("tier-up-stud-pop", "0.3,1.6,0.5,1");

// A feather of the Platine's wings unfurling, overshooting before it settles.
export const UNFURL = CustomEase.create("tier-up-unfurl", "0.3,1.45,0.5,1");

// A feather of the Diamant's wings unfurling, overshooting further.
export const FAN_OUT = CustomEase.create("tier-up-fan-out", "0.25,1.6,0.5,1");

// The old Emblem sucked into itself, faster and faster.
export const IMPLODE = CustomEase.create("tier-up-implode", "0.7,0,0.9,0.3");

// The streaks of light rushing into the heart of light.
export const CONVERGE = CustomEase.create("tier-up-converge", "0.6,0,0.9,0.6");

// A facet of the Diamant flying in, fast, then settling into place.
export const FACET = CustomEase.create("tier-up-facet", "0.16,0.84,0.3,1");

// The Diamant landing, swelling as it strikes.
export const LAND = CustomEase.create("tier-up-land", "0.2,0.9,0.3,1");

// The name slammed in as a whole.
export const SLAM = CustomEase.create("tier-up-slam", "0.2,0.9,0.2,1");

// Glitter falling, faster and faster.
export const FALL = CustomEase.create("tier-up-fall", "0.4,0,0.8,0.6");

// CSS `ease-in`: the heat rising in the old Emblem, its cracks running through it.
export const EASE_IN = CustomEase.create("tier-up-ease-in", "0.42,0,1,1");

// The facets of the old gem flung out, fast, then drifting away.
export const FLING = CustomEase.create("tier-up-fling", "0.1,0.6,0.3,1");

// The embers swirling into the vortex, faster and faster as they near its heart.
export const VORTEX = CustomEase.create("tier-up-vortex", "0.5,0,0.9,0.6");

// The Maniac's crown dropping from above, faster and faster until it lands.
export const DROP = CustomEase.create("tier-up-drop", "0.6,0,1,0.5");

// The flame over the crown catching, overshooting before it settles.
export const IGNITE = CustomEase.create("tier-up-ignite", "0.3,1.4,0.5,1");

// A gust of fire blown out of the crown, fast, then dying away.
export const GUST = CustomEase.create("tier-up-gust", "0.15,0.7,0.3,1");

// The Maniac's wings beating once: raised, swept down past rest, then back.
export const BEAT_RAISE = CustomEase.create("tier-up-beat-raise", "0.4,0,0.6,1");

export const BEAT_SWEEP = CustomEase.create("tier-up-beat-sweep", "0.7,0,0.2,1");

export const BEAT_REST = CustomEase.create("tier-up-beat-rest", "0.3,0,0.3,1");

// A letter of the Maniac's name slammed down on its own.
export const LETTER_SLAM = CustomEase.create("tier-up-letter-slam", "0.5,0,0.2,1");

// A feather of the Maniac's wings spreading: shooting out, then swept round into place.
export const SPREAD_OUT = CustomEase.create("tier-up-spread-out", "0.2,0.9,0.3,1");

export const SPREAD_ROUND = CustomEase.create("tier-up-spread-round", "0.55,0,0.15,1");

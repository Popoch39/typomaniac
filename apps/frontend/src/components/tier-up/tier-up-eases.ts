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

import { WING_ROOT } from "@/components/tier/sprite/tier-wing-fans";

// A wing flutters about its root by `--flap` (deg), each of its feathers turns about it by
// `--turn` (deg) and grows by `--grow`: GSAP moves the variables, never an SVG transform.
export const FLAPPING = "[transform:rotate(calc(var(--flap,0)*1deg))]";

export const WING_ROOTED = { transformOrigin: `${WING_ROOT.x}px ${WING_ROOT.y}px` };

export const UNFURLED =
  "[transform-origin:0_0] [transform:rotate(calc(var(--turn,0)*1deg))_scale(var(--grow,1))]";

// The same, the feather then swaying about its root on its own by `--sway` (deg).
export const SWAYING =
  "[transform-origin:0_0] [transform:rotate(calc(var(--turn,0)*1deg))_scale(var(--grow,1))_rotate(calc(var(--sway,0)*1deg))]";

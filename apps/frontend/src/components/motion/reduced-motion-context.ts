import { createContext, use } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// Whether reduced motion is forced on whatever the User's preference: only a dev page forces it,
// to try what a User who prefers less motion sees. Off by default.
export const ForcedReducedMotionContext = createContext(false);

export const useForcedReducedMotion = () => use(ForcedReducedMotionContext);

// Whether motion is reduced right now: forced, or the User's preference.
export const reducedMotion = (forced: boolean) =>
  forced || window.matchMedia(REDUCED_MOTION).matches;

import { useSyncExternalStore } from "react";

// Below 1440 px wide (ADR 0013), the sidebar folds into its Rail: at 1280, the design's width,
// Jouer's cards get back the room they have at 1440 beside the whole sidebar.
const RAIL_QUERY = "(width < 90rem)";

// On every resize rather than the query's `change`, which happy-dom misses the first time: the
// snapshot is a boolean, a resize that keeps it renders nothing.
const subscribe = (onChange: () => void) => {
  window.addEventListener("resize", onChange);

  return () => window.removeEventListener("resize", onChange);
};

const railNow = () => window.matchMedia(RAIL_QUERY).matches;

// Whether the sidebar is its Rail, read from the window on the first render: nothing flashes. A
// resize across 1440 px switches at once, never animated.
export const useSidebarRail = () => useSyncExternalStore(subscribe, railNow);

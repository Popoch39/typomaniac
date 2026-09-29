import { useEffect } from "react";

import { shellHeldByReplay } from "@/components/intro-dev/intro-replay";
import { useIntroStore } from "@/stores/intro-store";

// In a dev build, an Intro replayed from /dev/intro may hold the shell back (see intro-replay).
const heldByReplay = import.meta.env.DEV ? shellHeldByReplay : () => false;

// Called by the home page: once it is mounted, the sidebar and the page are there, and the Intro
// can go on past its waiting point.
export const useShellReady = () => {
  useEffect(() => {
    if (!heldByReplay()) {
      useIntroStore.getState().markShellReady();
    }
  }, []);
};

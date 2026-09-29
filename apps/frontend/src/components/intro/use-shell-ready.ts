import { useEffect } from "react";

import { useIntroStore } from "@/stores/intro-store";

// Called by the home page: once it is mounted, the sidebar and the page are there, and the Intro
// can go on past its waiting point.
export const useShellReady = () => {
  useEffect(() => {
    useIntroStore.getState().markShellReady();
  }, []);
};

import type { AnyRouter } from "@tanstack/react-router";

import { useIntroStore } from "@/stores/intro-store";

// A start that fails (the root route cannot read `/me`) never mounts the home page: the Intro would
// wait on it forever. The error the router shows is then what the Intro gives way to, at its next
// waiting point. Only the first load counts.
export const readyOnFailedStart = (router: AnyRouter) => {
  const unsubscribe = router.subscribe("onResolved", () => {
    unsubscribe();

    if (router.state.matches.some((match) => match.status === "error")) {
      useIntroStore.getState().markShellReady();
    }
  });
};

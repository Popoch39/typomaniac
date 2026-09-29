import type { AnyRouter } from "@tanstack/react-router";

import { useIntroStore } from "@/stores/intro-store";

// The shell is ready once the router has rendered its next load, whatever it shows: the page with
// its data, the page no route answers, a page's error, or the error of a start that fails (the root
// route cannot read `/me`, no sidebar to land in: the Intro gives way to it). Until then, the caret
// waits. Called once as the page starts, for its first load, and by a replay of /dev/intro.
export const readyOnFirstRender = (router: AnyRouter) => {
  const unsubscribe = router.subscribe("onRendered", () => {
    unsubscribe();
    useIntroStore.getState().markShellReady();
  });
};

import { gsap } from "gsap";

import { WAIT_S } from "@/components/intro/intro-timelines";
import { useIntroReplayStore } from "@/stores/intro-replay-store";
import { afterIntro, useIntroStore } from "@/stores/intro-store";

// Dev build only: /dev/intro replays the Intro on the real shell, without reloading the app. Only
// dev code imports this module, or behind `import.meta.env.DEV`: it is not in the production build.

// Plays the Intro again, as the page's start does, with the page's options until it ends. The
// caller then goes to the home page. With a delay, the shell is ready that long after the waiting
// point, on the Intro's clock (at its speed), counted from now: the overlay mounts, and the typing
// starts, at once. Without one, the home page's mount says it, as it does at the page's start.
export const replayIntro = () => {
  const { speed, shellDelay } = useIntroReplayStore.getState();

  useIntroReplayStore.setState({ replaying: true });
  useIntroStore.getState().play();

  const late =
    shellDelay === 0
      ? null
      : gsap.delayedCall((WAIT_S + shellDelay) / speed, () =>
          useIntroStore.getState().markShellReady(),
        );

  afterIntro(() => {
    late?.kill();
    useIntroReplayStore.setState({ replaying: false });
  });
};

// Each timeline of the Intro, in a dev build: a replayed one at the chosen speed. Only the Intro's
// own: GSAP's global timeline would make every running animation jump as it changes speed.
export const atReplaySpeed = (timeline: gsap.core.Timeline) => {
  const { replaying, speed } = useIntroReplayStore.getState();

  return replaying ? timeline.timeScale(speed) : timeline;
};

// Whether the home page's mount is not what makes the shell ready: a replay with a delay says it.
export const shellHeldByReplay = () => {
  const { replaying, shellDelay } = useIntroReplayStore.getState();

  return replaying && shellDelay > 0;
};

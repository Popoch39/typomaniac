import { FpsCounter } from "@/components/aura-gallery/fps-counter";
import { useIntroReplayStore } from "@/stores/intro-replay-store";

// Beside the Intro's overlay, in a dev build: the frame rate, over it, while a replayed Intro plays.
export const IntroReplayFps = () => {
  const replaying = useIntroReplayStore((store) => store.replaying);

  return replaying ? <FpsCounter /> : null;
};

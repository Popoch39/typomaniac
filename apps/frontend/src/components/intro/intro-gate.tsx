import { IntroReplayFps } from "@/components/intro-dev/intro-replay-fps";
import { IntroOverlay } from "@/components/intro/intro-overlay";
import { useIntroStore } from "@/stores/intro-store";

// Beside the router (main.tsx), so that the overlay is there from React's first commit, before
// `/me`; unmounted once the Intro is over. In a dev build, the frame rate over an Intro replayed
// from /dev/intro.
export const IntroGate = () => {
  const playing = useIntroStore((store) => store.playing);

  return playing ? (
    <>
      <IntroOverlay />
      {import.meta.env.DEV ? <IntroReplayFps /> : null}
    </>
  ) : null;
};

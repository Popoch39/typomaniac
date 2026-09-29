import { useRef } from "react";

import { IntroLockup } from "@/components/intro/intro-lockup";
import { useIntroTimeline } from "@/components/intro/use-intro-timeline";

// The Intro's layer: the Theme's ink over the whole window, above the shell, silent for assistive
// technologies (the app is presented once the Intro is over). Isolated: the letters it types
// never lay out anything else.
export const IntroOverlay = () => {
  const scope = useRef<HTMLDivElement>(null);

  useIntroTimeline(scope);

  return (
    <div
      ref={scope}
      data-intro="overlay"
      aria-hidden="true"
      className="fixed inset-0 z-[60] bg-background contain-strict"
    >
      <IntroLockup />
    </div>
  );
};

import type { ReactNode } from "react";

import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The card that plays the Replay: its time bar, then its controls.
export const ReplayLecture = ({ children }: { children: ReactNode }) => {
  const locale = useLocale();

  return (
    <section
      aria-label={m.replay_playback({}, { locale })}
      className="flex flex-col gap-3.5 rounded-card bg-card px-6 pt-4.5 pb-5"
    >
      {children}
    </section>
  );
};

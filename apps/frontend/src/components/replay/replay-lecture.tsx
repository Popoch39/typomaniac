import type { ReactNode } from "react";

// The card that plays the Replay: its time bar, then its controls.
export const ReplayLecture = ({ children }: { children: ReactNode }) => (
  <section
    aria-label="Lecture"
    className="flex flex-col gap-3.5 rounded-card bg-card px-6 pt-4.5 pb-5"
  >
    {children}
  </section>
);

import { Suspense, useState, useTransition } from "react";

import { DEFAULT_PROGRESSION_WINDOW, type ProgressionWindow } from "@/api/profile";
import { ProgressionCharts } from "@/components/profile/progression-charts";
import { ProgressionWindowPicker } from "@/components/profile/progression-window-picker";

// The Progression of the User who holds `handle`, over the window they pick. A new window keeps the
// curves on screen until it is loaded: the tiles and the record never wait for it.
export const ProfileProgression = ({ handle }: { handle: string }) => {
  const [span, setSpan] = useState<ProgressionWindow>(DEFAULT_PROGRESSION_WINDOW);
  const [isPending, startTransition] = useTransition();

  const pick = (next: ProgressionWindow) => startTransition(() => setSpan(next));

  return (
    <section aria-label="Progression" className="flex flex-col gap-3" aria-busy={isPending}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">Progression</h3>
        <ProgressionWindowPicker span={span} onChange={pick} />
      </div>
      <Suspense>
        <ProgressionCharts handle={handle} span={span} />
      </Suspense>
    </section>
  );
};

import { Suspense, useId, useState, useTransition } from "react";

import { DEFAULT_PROGRESSION_WINDOW, type ProgressionWindow } from "@/api/profile";
import { PROGRESSION_CARD_PAINT } from "@/components/profile/profile-paint";
import { ProgressionCharts } from "@/components/profile/progression-charts";
import { ProgressionChartsSkeleton } from "@/components/profile/progression-charts-skeleton";
import { ProgressionWindowPicker } from "@/components/profile/progression-window-picker";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Progression of the User who holds `handle`, on its card, over the window they pick. A new
// window keeps the curves on screen until it is loaded: the tiles never wait for it.
export const ProfileProgression = ({ handle }: { handle: string }) => {
  const locale = useLocale();
  const [span, setSpan] = useState<ProgressionWindow>(DEFAULT_PROGRESSION_WINDOW);
  const [isPending, startTransition] = useTransition();
  const titleId = useId();

  const pick = (next: ProgressionWindow) => startTransition(() => setSpan(next));

  return (
    <section aria-labelledby={titleId} aria-busy={isPending} className={PROGRESSION_CARD_PAINT}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-[19px] font-bold">
          {m.profile_progression_title({}, { locale })}
        </h2>
        <ProgressionWindowPicker span={span} onChange={pick} />
      </div>
      <Suspense fallback={<ProgressionChartsSkeleton />}>
        <ProgressionCharts handle={handle} span={span} />
      </Suspense>
    </section>
  );
};

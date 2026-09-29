import { useSuspenseQuery } from "@tanstack/react-query";

import { type ProgressionWindow, profileQueryOptions } from "@/api/profile";
import { ProgressionChart } from "@/components/profile/progression-chart";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The four curves of the Progression over the chosen window.
export const ProgressionCharts = ({
  handle,
  span,
}: {
  handle: string;
  span: ProgressionWindow;
}) => {
  const locale = useLocale();
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle, span));
  const points = profile.stats.progression;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        {m.profile_progression_duels(
          { count: points.length, shown: numberFormat(locale).format(points.length) },
          { locale },
        )}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        <ProgressionChart points={points} metric="wpm" />
        <ProgressionChart points={points} metric="raw" />
        <ProgressionChart points={points} metric="accuracy" />
        <ProgressionChart points={points} metric="consistency" />
      </div>
    </div>
  );
};

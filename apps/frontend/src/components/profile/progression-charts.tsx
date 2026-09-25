import { useSuspenseQuery } from "@tanstack/react-query";

import { type ProgressionWindow, profileQueryOptions } from "@/api/profile";
import { ProgressionChart } from "@/components/profile/progression-chart";

// The four curves of the Progression over the chosen window.
export const ProgressionCharts = ({
  handle,
  span,
}: {
  handle: string;
  span: ProgressionWindow;
}) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle, span));
  const points = profile.stats.progression;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        {points.length} {points.length === 1 ? "Duel" : "Duels"}, hors Forfeits
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <ProgressionChart points={points} metric="wpm" />
        <ProgressionChart points={points} metric="raw" />
        <ProgressionChart points={points} metric="accuracy" />
        <ProgressionChart points={points} metric="consistency" />
      </div>
    </div>
  );
};

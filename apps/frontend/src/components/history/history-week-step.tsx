import { Link } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { weekSearch, type WeekKey } from "@/components/history/history-week";
import { Button } from "@/components/ui/button";

type HistoryWeekStepProps = {
  direction: "previous" | "next";
  // The week it goes to; null where there is none: a dimmed button, not a link.
  to: WeekKey | null;
  current: WeekKey;
  label: string;
};

const STEP_PAINT =
  "rounded-[14px] bg-transparent hover:bg-surface-2 disabled:opacity-35 [&_svg]:size-4.5";

// One week back or on, from the header of the History.
export const HistoryWeekStep = ({ direction, to, current, label }: HistoryWeekStepProps) => {
  const icon =
    direction === "previous" ? (
      <ChevronLeftIcon aria-hidden="true" strokeWidth={2} />
    ) : (
      <ChevronRightIcon aria-hidden="true" strokeWidth={2} />
    );

  return to === null ? (
    <Button variant="outline" size="icon" disabled aria-label={label} className={STEP_PAINT}>
      {icon}
    </Button>
  ) : (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      className={STEP_PAINT}
      nativeButton={false}
      render={<Link to="/history" search={weekSearch(to, current)} />}
    >
      {icon}
    </Button>
  );
};

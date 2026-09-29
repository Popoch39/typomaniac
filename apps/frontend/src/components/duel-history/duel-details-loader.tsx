import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

import { DuelDetailsBody } from "@/components/duel-history/duel-details-body";
import { DuelDetailsError } from "@/components/duel-history/duel-details-error";
import { DuelDetailsSkeleton } from "@/components/duel-history/duel-details-skeleton";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// What the chosen Duel itself tells, read on its own: a skeleton while it loads, never holding up
// the list, and its error in its place if it cannot be read.
export const DuelDetailsLoader = ({ duelId }: { duelId: string }) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary onRetry={reset} fallback={DuelDetailsError}>
        <Suspense fallback={<DuelDetailsSkeleton />}>
          <DuelDetailsBody duelId={duelId} />
        </Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);
